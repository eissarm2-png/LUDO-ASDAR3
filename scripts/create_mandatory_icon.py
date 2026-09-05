import os
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_mandatory_master_icon(output_path="/tmp/abqor_mandatory_icon.png"):
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="46%" r="60%">
      <stop offset="0%" stop-color="#6e138a" />
      <stop offset="35%" stop-color="#3c0750" />
      <stop offset="70%" stop-color="#1b0226" />
      <stop offset="100%" stop-color="#0e0114" />
    </radialGradient>

    <!-- Outer Gold Border Gradient -->
    <linearGradient id="goldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE885" />
      <stop offset="25%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#916612" />
      <stop offset="75%" stop-color="#FCE182" />
      <stop offset="100%" stop-color="#875306" />
    </linearGradient>

    <!-- Inner Gold Border Gradient -->
    <linearGradient id="goldInner" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF0A0" />
      <stop offset="30%" stop-color="#D9A832" />
      <stop offset="70%" stop-color="#7A4D05" />
      <stop offset="100%" stop-color="#F5CF60" />
    </linearGradient>

    <!-- Crown Gold Gradient -->
    <linearGradient id="crownGold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5B8" />
      <stop offset="30%" stop-color="#F7C948" />
      <stop offset="70%" stop-color="#C68A16" />
      <stop offset="100%" stop-color="#634005" />
    </linearGradient>

    <!-- Ruby Gemstone Gradient -->
    <linearGradient id="ruby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B8B" />
      <stop offset="40%" stop-color="#DC143C" />
      <stop offset="80%" stop-color="#800018" />
      <stop offset="100%" stop-color="#40000A" />
    </linearGradient>

    <!-- Arabic Text Gold Gradient (Abqor) -->
    <linearGradient id="textGold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="18%" stop-color="#FFF099" />
      <stop offset="50%" stop-color="#E5A922" />
      <stop offset="80%" stop-color="#945A09" />
      <stop offset="100%" stop-color="#5E3703" />
    </linearGradient>

    <!-- White Enamel Text (Al-Ludo) -->
    <linearGradient id="whiteEnamel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F0F4FA" />
      <stop offset="100%" stop-color="#D2D9E8" />
    </linearGradient>

    <!-- Pawn Gradients -->
    <radialGradient id="redPawn" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFA8A6" />
      <stop offset="35%" stop-color="#ED2824" />
      <stop offset="80%" stop-color="#8C0D0A" />
      <stop offset="100%" stop-color="#4A0504" />
    </radialGradient>

    <radialGradient id="greenPawn" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#A6FFAE" />
      <stop offset="35%" stop-color="#18B83F" />
      <stop offset="80%" stop-color="#0C5E1F" />
      <stop offset="100%" stop-color="#052E0E" />
    </radialGradient>

    <radialGradient id="bluePawn" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#A8D4FF" />
      <stop offset="35%" stop-color="#1B6DF2" />
      <stop offset="80%" stop-color="#0C3B8A" />
      <stop offset="100%" stop-color="#051C47" />
    </radialGradient>

    <radialGradient id="yellowPawn" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFF7B0" />
      <stop offset="35%" stop-color="#FBBF04" />
      <stop offset="80%" stop-color="#A37102" />
      <stop offset="100%" stop-color="#4F3600" />
    </radialGradient>

    <!-- Filters -->
    <filter id="shadowHeavy" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="innerBevel" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.6" />
    </filter>

    <!-- Clip Path for Inside the Squircle Frame -->
    <clipPath id="squircleInner">
      <rect x="36" y="36" width="952" height="952" rx="190" ry="190" />
    </clipPath>
  </defs>

  <!-- 1. OUTSIDE FRAME (SQUIRCLE) -->
  <rect x="12" y="12" width="1000" height="1000" rx="210" ry="210" fill="url(#goldOuter)" filter="url(#shadowHeavy)" />
  <rect x="24" y="24" width="976" height="976" rx="198" ry="198" fill="#3D1A04" />
  <rect x="32" y="32" width="960" height="960" rx="192" ry="192" fill="url(#goldInner)" />

  <!-- 2. CLIPPED MAIN STAGE -->
  <g clip-path="url(#squircleInner)">
    <!-- Stage Background -->
    <rect x="36" y="36" width="952" height="952" fill="url(#bgGlow)" />

    <!-- Radiant Burst Rays -->
    <g opacity="0.25" stroke="#FFA726" stroke-width="2">
      <line x1="512" y1="460" x2="36" y2="36" stroke-width="48" opacity="0.15" />
      <line x1="512" y1="460" x2="988" y2="36" stroke-width="48" opacity="0.15" />
      <line x1="512" y1="460" x2="512" y2="36" stroke-width="64" opacity="0.2" />
      <line x1="512" y1="460" x2="100" y2="250" stroke-width="36" opacity="0.12" />
      <line x1="512" y1="460" x2="924" y2="250" stroke-width="36" opacity="0.12" />
      <line x1="512" y1="460" x2="250" y2="100" stroke-width="40" opacity="0.15" />
      <line x1="512" y1="460" x2="774" y2="100" stroke-width="40" opacity="0.15" />
    </g>

    <!-- Star Sparkles in Sky -->
    <g fill="#FFF9C4" filter="url(#glowGold)">
      <!-- Top Left Star -->
      <polygon points="210,140 216,155 235,158 219,168 222,185 210,172 198,185 201,168 185,158 204,155" />
      <!-- Top Right Star -->
      <polygon points="814,140 820,155 839,158 823,168 826,185 814,172 802,185 805,168 789,158 808,155" />
      <!-- Upper Center Sparkle -->
      <circle cx="512" cy="78" r="5" fill="#FFFFFF" />
      <circle cx="340" cy="190" r="4" fill="#FFEB3B" opacity="0.8" />
      <circle cx="684" cy="190" r="4" fill="#FFEB3B" opacity="0.8" />
    </g>

    <!-- 3. LUDO BOARD IN BACKGROUND (PERSPECTIVE) -->
    <g opacity="0.55" transform="translate(0, 150)">
      <!-- Red quadrant tracks (Top-Left) -->
      <rect x="120" y="320" width="80" height="80" rx="8" fill="#D32F2F" stroke="#FFE082" stroke-width="2" />
      <rect x="205" y="320" width="80" height="80" rx="8" fill="#D32F2F" stroke="#FFE082" stroke-width="2" />
      <rect x="120" y="405" width="80" height="80" rx="8" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="2" />
      <polygon points="160,345 165,360 180,360 168,370 172,385 160,375 148,385 152,370 140,360 155,360" fill="#FFD700" />

      <!-- Green quadrant tracks (Top-Right) -->
      <rect x="824" y="320" width="80" height="80" rx="8" fill="#388E3C" stroke="#FFE082" stroke-width="2" />
      <rect x="739" y="320" width="80" height="80" rx="8" fill="#388E3C" stroke="#FFE082" stroke-width="2" />
      <rect x="824" y="405" width="80" height="80" rx="8" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="2" />
      <polygon points="864,345 869,360 884,360 872,370 876,385 864,375 852,385 856,370 844,360 859,360" fill="#FFD700" />

      <!-- Blue quadrant tracks (Bottom-Left) -->
      <rect x="120" y="580" width="80" height="80" rx="8" fill="#1976D2" stroke="#FFE082" stroke-width="2" />
      <rect x="205" y="580" width="80" height="80" rx="8" fill="#1976D2" stroke="#FFE082" stroke-width="2" />
      <rect x="120" y="665" width="80" height="80" rx="8" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="2" />

      <!-- Yellow quadrant tracks (Bottom-Right) -->
      <rect x="824" y="580" width="80" height="80" rx="8" fill="#FBC02D" stroke="#FFE082" stroke-width="2" />
      <rect x="739" y="580" width="80" height="80" rx="8" fill="#FBC02D" stroke="#FFE082" stroke-width="2" />
      <rect x="824" y="665" width="80" height="80" rx="8" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="2" />
    </g>

    <!-- 4. FOUR 3D LUDO PAWNS -->
    <!-- Top-Left Red Pawn -->
    <g filter="url(#shadowHeavy)" transform="translate(140, 240)">
      <!-- Base ring -->
      <ellipse cx="60" cy="180" rx="55" ry="24" fill="url(#redPawn)" />
      <!-- Body cone -->
      <path d="M 25,170 C 25,120 42,90 45,75 C 50,75 70,75 75,75 C 78,90 95,120 95,170 Z" fill="url(#redPawn)" />
      <!-- Collar -->
      <ellipse cx="60" cy="72" rx="30" ry="10" fill="url(#redPawn)" />
      <!-- Head sphere -->
      <circle cx="60" cy="42" r="32" fill="url(#redPawn)" />
      <ellipse cx="50" cy="30" rx="12" ry="7" fill="#FFFFFF" opacity="0.6" transform="rotate(-25 50 30)" />
    </g>

    <!-- Top-Right Green Pawn -->
    <g filter="url(#shadowHeavy)" transform="translate(764, 240)">
      <ellipse cx="60" cy="180" rx="55" ry="24" fill="url(#greenPawn)" />
      <path d="M 25,170 C 25,120 42,90 45,75 C 50,75 70,75 75,75 C 78,90 95,120 95,170 Z" fill="url(#greenPawn)" />
      <ellipse cx="60" cy="72" rx="30" ry="10" fill="url(#greenPawn)" />
      <circle cx="60" cy="42" r="32" fill="url(#greenPawn)" />
      <ellipse cx="50" cy="30" rx="12" ry="7" fill="#FFFFFF" opacity="0.6" transform="rotate(-25 50 30)" />
    </g>

    <!-- Bottom-Left Blue Pawn -->
    <g filter="url(#shadowHeavy)" transform="translate(100, 640)">
      <ellipse cx="60" cy="190" rx="60" ry="26" fill="url(#bluePawn)" />
      <path d="M 20,180 C 20,125 40,92 44,78 C 50,78 70,78 76,78 C 80,92 100,125 100,180 Z" fill="url(#bluePawn)" />
      <ellipse cx="60" cy="75" rx="32" ry="11" fill="url(#bluePawn)" />
      <circle cx="60" cy="44" r="35" fill="url(#bluePawn)" />
      <ellipse cx="48" cy="30" rx="14" ry="8" fill="#FFFFFF" opacity="0.65" transform="rotate(-25 48 30)" />
    </g>

    <!-- Bottom-Right Yellow Pawn -->
    <g filter="url(#shadowHeavy)" transform="translate(804, 640)">
      <ellipse cx="60" cy="190" rx="60" ry="26" fill="url(#yellowPawn)" />
      <path d="M 20,180 C 20,125 40,92 44,78 C 50,78 70,78 76,78 C 80,92 100,125 100,180 Z" fill="url(#yellowPawn)" />
      <ellipse cx="60" cy="75" rx="32" ry="11" fill="url(#yellowPawn)" />
      <circle cx="60" cy="44" r="35" fill="url(#yellowPawn)" />
      <ellipse cx="48" cy="30" rx="14" ry="8" fill="#FFFFFF" opacity="0.75" transform="rotate(-25 48 30)" />
    </g>

    <!-- 5. 3D GRAND ROYAL CROWN -->
    <g filter="url(#shadowHeavy)" transform="translate(512, 230)">
      <!-- Crown Back Rim -->
      <path d="M -230,50 Q 0,85 230,50 Q 200,95 0,105 Q -200,95 -230,50 Z" fill="#784205" />

      <!-- Crown Main Spikes -->
      <!-- Left outer peak -->
      <path d="M -220,50 L -215,-70 L -165,10 Z" fill="url(#crownGold)" stroke="#FFF5B8" stroke-width="2" />
      <circle cx="-215" cy="-70" r="16" fill="url(#crownGold)" />
      <circle cx="-215" cy="-70" r="10" fill="url(#ruby)" />

      <!-- Left mid peak -->
      <path d="M -165,10 L -125,-120 L -75,25 Z" fill="url(#crownGold)" stroke="#FFF5B8" stroke-width="2" />
      <circle cx="-125" cy="-120" r="19" fill="url(#crownGold)" />
      <circle cx="-125" cy="-120" r="12" fill="url(#ruby)" />

      <!-- Center Grand Peak -->
      <path d="M -90,25 L 0,-175 L 90,25 Z" fill="url(#crownGold)" stroke="#FFF5B8" stroke-width="3" />
      <circle cx="0" cy="-175" r="24" fill="url(#crownGold)" />
      <circle cx="0" cy="-175" r="15" fill="url(#ruby)" />

      <!-- Right mid peak -->
      <path d="M 75,25 L 125,-120 L 165,10 Z" fill="url(#crownGold)" stroke="#FFF5B8" stroke-width="2" />
      <circle cx="125" cy="-120" r="19" fill="url(#crownGold)" />
      <circle cx="125" cy="-120" r="12" fill="url(#ruby)" />

      <!-- Right outer peak -->
      <path d="M 165,10 L 215,-70 L 220,50 Z" fill="url(#crownGold)" stroke="#FFF5B8" stroke-width="2" />
      <circle cx="215" cy="-70" r="16" fill="url(#crownGold)" />
      <circle cx="215" cy="-70" r="10" fill="url(#ruby)" />

      <!-- Crown Base Band -->
      <path d="M -225,48 Q 0,85 225,48 L 225,85 Q 0,125 -225,85 Z" fill="url(#crownGold)" stroke="#FFF9C4" stroke-width="2" />

      <!-- Central Large Ruby Diamond on Crown -->
      <polygon points="0,-45 42,-8 0,30 -42,-8" fill="url(#ruby)" stroke="#FFF0F5" stroke-width="2" filter="url(#glowGold)" />
      <!-- Ruby Facet Highlights -->
      <polygon points="0,-45 0,30 -42,-8" fill="#FFFFFF" opacity="0.25" />
      <polygon points="0,-45 20,-26 0,0 -20,-26" fill="#FFFFFF" opacity="0.6" />

      <!-- Flanking Pearls & Rubies on Band -->
      <circle cx="-140" cy="72" r="11" fill="url(#ruby)" stroke="#FFD700" stroke-width="2" />
      <circle cx="-70" cy="85" r="12" fill="url(#ruby)" stroke="#FFD700" stroke-width="2" />
      <circle cx="0" cy="90" r="14" fill="url(#ruby)" stroke="#FFD700" stroke-width="2" />
      <circle cx="70" cy="85" r="12" fill="url(#ruby)" stroke="#FFD700" stroke-width="2" />
      <circle cx="140" cy="72" r="11" fill="url(#ruby)" stroke="#FFD700" stroke-width="2" />
    </g>

    <!-- 6. 3D ARABIC TYPOGRAPHY "عبقور اللودو" -->
    <!-- Drop Shadow Base Plaque behind text -->
    <g filter="url(#shadowHeavy)">
      <!-- Extruded Dark Backing for Text -->
      <path d="M 220,380 Q 512,320 804,380 Q 860,520 840,730 Q 512,770 184,730 Q 164,520 220,380 Z" fill="#1C0324" opacity="0.95" stroke="#521568" stroke-width="6" />
    </g>

    <!-- Word 1: "عبقور" (3D Gold) -->
    <!-- 3D Extrusion Layers -->
    <g font-family="'Cairo', 'Changa', 'Noto Sans Arabic', sans-serif" font-weight="900" font-size="168" text-anchor="middle">
      <text x="512" y="520" fill="#2E0701">عبقور</text>
      <text x="512" y="516" fill="#521D02">عبقور</text>
      <text x="512" y="512" fill="#7D3204">عبقور</text>
      <text x="512" y="508" fill="#B05206">عبقور</text>
      <text x="512" y="504" fill="#E6800B">عبقور</text>
      <!-- Main Face -->
      <text x="512" y="500" fill="url(#textGold)" stroke="#FFEAA7" stroke-width="4">عبقور</text>
    </g>

    <!-- Word 2: "اللودو" (3D White Enamel with Golden Rim) -->
    <!-- 3D Extrusion Layers -->
    <g font-family="'Cairo', 'Changa', 'Noto Sans Arabic', sans-serif" font-weight="900" font-size="185" text-anchor="middle">
      <text x="512" y="700" fill="#1A0216" stroke="#420638" stroke-width="28">اللودو</text>
      <text x="512" y="694" fill="#663A04" stroke="#8A5306" stroke-width="22">اللودو</text>
      <text x="512" y="688" fill="#A86F07" stroke="#C48809" stroke-width="18">اللودو</text>
      <text x="512" y="682" fill="#E0A314" stroke="#E6A817" stroke-width="14">اللودو</text>
      <text x="512" y="676" fill="#FFDB4D" stroke="#FFE680" stroke-width="10">اللودو</text>
      <!-- Main Enamel Face -->
      <text x="512" y="670" fill="url(#whiteEnamel)" stroke="#FFFFFF" stroke-width="2">اللودو</text>
    </g>

    <!-- 7. 3D ISOMETRIC WHITE LUDO DICE (BOTTOM CENTER) -->
    <g filter="url(#shadowHeavy)" transform="translate(512, 830)">
      <!-- Top Face -->
      <polygon points="0,-75 110,-25 0,25 -110,-25" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="3" />
      <!-- Left Face -->
      <polygon points="-110,-25 0,25 0,125 -110,75" fill="#E6E9F0" stroke="#CCCCCC" stroke-width="3" />
      <!-- Right Face -->
      <polygon points="0,25 110,-25 110,75 0,125" fill="#CFD6E4" stroke="#B0B8C8" stroke-width="3" />

      <!-- Pips (Dots) on Top Face (Center 1 Pip) -->
      <ellipse cx="0" cy="-25" rx="14" ry="7" fill="#1A1A1A" />
      <ellipse cx="2" cy="-26" rx="4" ry="2" fill="#FFFFFF" opacity="0.6" />

      <!-- Pips on Left Face (3 Pips) -->
      <ellipse cx="-75" cy="15" rx="10" ry="14" fill="#1A1A1A" transform="skewY(24)" />
      <ellipse cx="-55" cy="50" rx="10" ry="14" fill="#1A1A1A" transform="skewY(24)" />
      <ellipse cx="-35" cy="85" rx="10" ry="14" fill="#1A1A1A" transform="skewY(24)" />

      <!-- Pips on Right Face (5 Pips) -->
      <ellipse cx="35" cy="15" rx="10" ry="14" fill="#1A1A1A" transform="skewY(-24)" />
      <ellipse cx="75" cy="15" rx="10" ry="14" fill="#1A1A1A" transform="skewY(-24)" />
      <ellipse cx="55" cy="50" rx="10" ry="14" fill="#1A1A1A" transform="skewY(-24)" />
      <ellipse cx="35" cy="85" rx="10" ry="14" fill="#1A1A1A" transform="skewY(-24)" />
      <ellipse cx="75" cy="85" rx="10" ry="14" fill="#1A1A1A" transform="skewY(-24)" />
    </g>

    <!-- Inner Golden Frame Glow & Highlights -->
    <rect x="36" y="36" width="952" height="952" rx="190" ry="190" fill="none" stroke="url(#goldOuter)" stroke-width="8" opacity="0.85" />
    <rect x="42" y="42" width="940" height="940" rx="184" ry="184" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.3" />
  </g>
</svg>"""

    svg_path = "/tmp/abqor_mandatory_master.svg"
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("Rendered master SVG...")
    # Convert to 1024x1024 PNG with rsvg-convert
    subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", svg_path, "-o", output_path], check=True)
    print(f"Generated 1024x1024 master icon at {output_path}!")
    return output_path

if __name__ == "__main__":
    create_mandatory_master_icon()
