import sys
import os
import io
import subprocess
import shutil
import zipfile
from PIL import Image, ImageDraw, ImageOps

def apply_icon(input_image_path):
    print(f"Applying icon from {input_image_path}...")
    if not os.path.exists(input_image_path):
        print(f"File {input_image_path} not found!")
        return False

    # Open image and convert to RGBA
    img = Image.open(input_image_path).convert("RGBA")
    
    # Square crop if needed
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img = img.crop((left, top, left + min_dim, top + min_dim))
    
    # 1. Generate Web sizes
    sizes = {
        "public/app-icon-512.png": (512, 512),
        "public/app-icon-192.png": (192, 192),
        "public/apple-touch-icon.png": (180, 180),
        "public/favicon.png": (64, 64),
    }
    
    for path, size in sizes.items():
        resized = img.resize(size, Image.Resampling.LANCZOS)
        resized.save(path, "PNG", optimize=True)
        # Also copy to .output/public if exists
        out_path = os.path.join(".output", path)
        if os.path.exists(os.path.dirname(out_path)):
            resized.save(out_path, "PNG", optimize=True)
        print(f"Updated {path}")
        
    fav = img.resize((32, 32), Image.Resampling.LANCZOS)
    fav.save("public/favicon.ico", format="ICO")
    if os.path.exists(".output/public"):
        fav.save(".output/public/favicon.ico", format="ICO")
    print("Updated public/favicon.ico")

    # 2. Generate Android source mipmaps
    def make_round(im):
        mask = Image.new("L", im.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, im.size[0], im.size[1]), fill=255)
        out = Image.new("RGBA", im.size, (0, 0, 0, 0))
        out.paste(im, (0, 0), mask=mask)
        return out

    densities = {
        "mdpi": (48, 108),
        "hdpi": (72, 162),
        "xhdpi": (96, 216),
        "xxhdpi": (144, 324),
        "xxxhdpi": (192, 432),
    }

    for density, (legacy_sz, adapt_sz) in densities.items():
        dir_path = f"android/app/src/main/res/mipmap-{density}"
        os.makedirs(dir_path, exist_ok=True)
        
        legacy = img.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS)
        legacy.save(f"{dir_path}/ic_launcher.png", "PNG", optimize=True)
        
        round_icon = make_round(legacy)
        round_icon.save(f"{dir_path}/ic_launcher_round.png", "PNG", optimize=True)
        
        # foreground (centered in safe circle with margin)
        fg_canvas = Image.new("RGBA", (adapt_sz, adapt_sz), (0, 0, 0, 0))
        inner_sz = int(adapt_sz * 0.72)
        inner_img = img.resize((inner_sz, inner_sz), Image.Resampling.LANCZOS)
        offset = (adapt_sz - inner_sz) // 2
        fg_canvas.paste(inner_img, (offset, offset), mask=inner_img)
        fg_canvas.save(f"{dir_path}/ic_launcher_foreground.png", "PNG", optimize=True)

    # 3. Inject into public/abqor-ludo.apk if it exists
    apk_path = "public/abqor-ludo.apk"
    if os.path.exists(apk_path):
        print("Injecting into APK...")
        densities_v4 = {
            "mdpi-v4": (48, 108),
            "hdpi-v4": (72, 162),
            "xhdpi-v4": (96, 216),
            "xxhdpi-v4": (144, 324),
            "xxxhdpi-v4": (192, 432),
        }
        
        # Background canvas for adaptive icon
        bg_canvas = Image.new("RGBA", (adapt_sz, adapt_sz), (0, 0, 0, 0))
        # Draw luxurious royal purple background with soft gold rim
        bg_draw = ImageDraw.Draw(bg_canvas)
        bg_draw.rectangle([0, 0, adapt_sz, adapt_sz], fill=(42, 6, 56, 255))
        
        new_entries = {}
        for dens, (leg_sz, adapt_sz) in densities_v4.items():
            leg = img.resize((leg_sz, leg_sz), Image.Resampling.LANCZOS)
            b_leg = io.BytesIO()
            leg.save(b_leg, "WEBP", lossless=True)
            new_entries[f"res/mipmap-{dens}/ic_launcher.webp"] = b_leg.getvalue()

            rnd = make_round(leg)
            b_rnd = io.BytesIO()
            rnd.save(b_rnd, "WEBP", lossless=True)
            new_entries[f"res/mipmap-{dens}/ic_launcher_round.webp"] = b_rnd.getvalue()

            # Background replacement (removes old green SWV background completely)
            cur_bg = bg_canvas.resize((adapt_sz, adapt_sz), Image.Resampling.LANCZOS)
            b_bg = io.BytesIO()
            cur_bg.save(b_bg, "WEBP", lossless=True)
            new_entries[f"res/mipmap-{dens}/ic_launcher_background.webp"] = b_bg.getvalue()

            # Foreground
            fg_canvas = Image.new("RGBA", (adapt_sz, adapt_sz), (0, 0, 0, 0))
            inner_sz = int(adapt_sz * 0.72)
            inner_img = img.resize((inner_sz, inner_sz), Image.Resampling.LANCZOS)
            offset = (adapt_sz - inner_sz) // 2
            fg_canvas.paste(inner_img, (offset, offset), mask=inner_img)
            b_fg = io.BytesIO()
            fg_canvas.save(b_fg, "WEBP", lossless=True)
            new_entries[f"res/mipmap-{dens}/ic_launcher_foreground.webp"] = b_fg.getvalue()

        temp_unsigned = "/tmp/apk_custom_unsigned.apk"
        with zipfile.ZipFile(apk_path, "r") as zin, zipfile.ZipFile(temp_unsigned, "w") as zout:
            for item in zin.infolist():
                if item.filename.startswith("META-INF/"):
                    continue
                if item.filename in new_entries:
                    zout.writestr(item.filename, new_entries[item.filename], compress_type=zipfile.ZIP_DEFLATED)
                else:
                    data = zin.read(item.filename)
                    zout.writestr(item.filename, data, compress_type=item.compress_type)

        # Zipalign
        temp_aligned = "/tmp/apk_custom_aligned.apk"
        subprocess.run(["zipalign", "-f", "-p", "4", temp_unsigned, temp_aligned], check=True)

        # Resign with abqor-release.keystore
        run_env = os.environ.copy()
        run_env["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"
        subprocess.run([
            "apksigner", "sign",
            "--ks", "abqor-release.keystore",
            "--ks-pass", "pass:abqor_ludo_2026",
            "--key-pass", "pass:abqor_ludo_2026",
            "--ks-key-alias", "abqor",
            "--min-sdk-version", "21",
            "--v1-signing-enabled", "true",
            "--v2-signing-enabled", "true",
            "--v3-signing-enabled", "true",
            "--out", apk_path,
            temp_aligned
        ], env=run_env, check=True)
        
        # Sync to copies
        if os.path.exists("public/ludo.apk"):
            shutil.copyfile(apk_path, "public/ludo.apk")
        if os.path.exists(".output/public/abqor-ludo.apk"):
            shutil.copyfile(apk_path, ".output/public/abqor-ludo.apk")
        if os.path.exists(".output/public/ludo.apk"):
            shutil.copyfile(apk_path, ".output/public/ludo.apk")

        print("APK successfully updated with custom icon and resigned!")

    print("Icon application completed successfully!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_icon.py <path_to_image>")
        sys.exit(1)
    apply_icon(sys.argv[1])
