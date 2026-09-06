import { useState, useId } from "react";
import { Sparkles, Dices, Check, Palette, Eye, Smile, Crown as CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarFrame } from "./AvatarFrame";
import { cn } from "@/lib/utils";

// خيارات الألوان الأساسية للخلفية
export const BG_COLORS = [
  { id: "gold", label: "ذهبي ملكي", hex: "#EAB308", bgHex: "#713f12" },
  { id: "emerald", label: "زمردي فاخر", hex: "#10B981", bgHex: "#064e3b" },
  { id: "cyan", label: "سايبر نيون", hex: "#06B6D4", bgHex: "#164e63" },
  { id: "purple", label: "جمشت بنفسجي", hex: "#A855F7", bgHex: "#581c87" },
  { id: "crimson", label: "لهب ياقوتي", hex: "#EF4444", bgHex: "#7f1d1d" },
  { id: "indigo", label: "كحلي ليلي", hex: "#6366F1", bgHex: "#312e81" },
  { id: "amber", label: "غروب برتقالي", hex: "#F97316", bgHex: "#7c2d12" },
  { id: "rose", label: "وردي زاهي", hex: "#EC4899", bgHex: "#831843" },
  { id: "dark", label: "فولاذ داكن", hex: "#64748B", bgHex: "#0f172a" },
];

// ألوان بشرة الوجه
export const SKIN_TONES = [
  { id: "peach", label: "فاتح", hex: "#FED7AA" },
  { id: "honey", label: "حنطي", hex: "#FDBA74" },
  { id: "tan", label: "برونزي", hex: "#FB923C" },
  { id: "deep", label: "أسمر", hex: "#C2410C" },
  { id: "cyber", label: "نيون", hex: "#67E8F9" },
  { id: "ludo", label: "ذهبي", hex: "#FDE047" },
];

// أشكال العيون
export const EYE_STYLES = [
  { id: "happy", label: "فرحان", icon: "^ ^" },
  { id: "shades", label: "نظارة شمسية", icon: "🕶️" },
  { id: "big", label: "عيون لامعة", icon: "👀" },
  { id: "star", label: "نجوم الفوز", icon: "🤩" },
  { id: "wink", label: "غمزة", icon: "😉" },
  { id: "goggles", label: "نظارة ألعاب", icon: "🥽" },
  { id: "fierce", label: "حماسي", icon: "⚡" },
  { id: "chill", label: "هادئ", icon: "˘ ˘" },
];

// تعابير الفم
export const MOUTH_STYLES = [
  { id: "grin", label: "ابتسامة عريضة", icon: "😃" },
  { id: "smirk", label: "واثق", icon: "😏" },
  { id: "tongue", label: "مرح ولعوب", icon: "😋" },
  { id: "cheer", label: "هتاف النصر", icon: "🥳" },
  { id: "smile", label: "هادئة", icon: "😊" },
  { id: "cool", label: "مستقيم", icon: "😎" },
  { id: "open", label: "متحمس", icon: "😮" },
  { id: "determined", label: "عازم", icon: "😼" },
];

// الإكسسوارات والرأس
export const ACCESSORIES = [
  { id: "none", label: "بدون", icon: "❌" },
  { id: "crown", label: "تاج لودو الذهبي", icon: "👑" },
  { id: "headset", label: "سماعات محترف", icon: "🎧" },
  { id: "halo", label: "هالة ملكية", icon: "😇" },
  { id: "horns", label: "قرون الشعلة", icon: "🔥" },
  { id: "bandana", label: "عصابة نينجا", icon: "🥋" },
  { id: "party", label: "قبعة فوز", icon: "🎉" },
  { id: "sparkles", label: "بريق النجوم", icon: "✨" },
];

type Props = {
  currentFrame?: string | null;
  onSelectAvatar: (avatarDataUrl: string) => void;
  onClose?: () => void;
};

export function AvatarGenerator({ currentFrame, onSelectAvatar, onClose }: Props) {
  const gradientId = useId();
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[1]);
  const [eyeStyle, setEyeStyle] = useState(EYE_STYLES[0]);
  const [mouthStyle, setMouthStyle] = useState(MOUTH_STYLES[0]);
  const [accessory, setAccessory] = useState(ACCESSORIES[1]);
  const [activeTab, setActiveTab] = useState<"color" | "eyes" | "mouth" | "acc">("color");

  const randomize = () => {
    setBgColor(BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)]);
    setSkinTone(SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)]);
    setEyeStyle(EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)]);
    setMouthStyle(MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)]);
    setAccessory(ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)]);
  };

  // توليد كود SVG النظيف والمشفر كـ DataURL
  const generateSvgString = () => {
    const eyesSvg = getEyesSvg(eyeStyle.id);
    const mouthSvg = getMouthSvg(mouthStyle.id);
    const accSvg = getAccessorySvg(accessory.id);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id="bg-${gradientId}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${bgColor.hex}" />
          <stop offset="100%" stop-color="${bgColor.bgHex}" />
        </radialGradient>
      </defs>
      <!-- خلفية الأيقونة -->
      <circle cx="50" cy="50" r="48" fill="url(#bg-${gradientId})" />
      
      <!-- إكسسوار خلفي كالهالة -->
      ${accessory.id === "halo" ? '<ellipse cx="50" cy="20" rx="22" ry="6" fill="none" stroke="#FDE047" stroke-width="4" filter="drop-shadow(0 0 4px #EAB308)" />' : ""}
      
      <!-- الرأس / الوجه -->
      <circle cx="50" cy="56" r="28" fill="${skinTone.hex}" stroke="#000000" stroke-width="1.5" />
      
      <!-- وجنات وردية -->
      <circle cx="33" cy="62" r="4" fill="#F43F5E" opacity="0.35" />
      <circle cx="67" cy="62" r="4" fill="#F43F5E" opacity="0.35" />

      <!-- العيون -->
      ${eyesSvg}

      <!-- الفم -->
      ${mouthSvg}

      <!-- إكسسوار أمامي كالقبعة أو التاج -->
      ${accSvg}
    </svg>`;
  };

  const handleApply = () => {
    const svgStr = generateSvgString();
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    onSelectAvatar(encoded);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#350d37] to-[#170318] p-4 text-white shadow-xl">
      {/* رأس القسم */}
      <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-ludo-gold/20 text-ludo-gold">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-ludo-gold">صانع الشخصيات المخصص</h3>
            <p className="text-[11px] text-ludo-soft/80">
              صمم أيقونتك بالألوان والعيون والتعابير المفضلة
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={randomize}
          className="border-ludo-gold/30 bg-black/30 text-xs font-bold text-ludo-gold hover:bg-ludo-gold/20 gap-1.5"
        >
          <Dices className="size-3.5" /> عشوائي
        </Button>
      </div>

      {/* منطقة المعاينة المباشرة مع الإطار الحالي */}
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <div className="relative">
          <AvatarFrame frameId={currentFrame} size="2xl" showBadge>
            <div className="size-full" dangerouslySetInnerHTML={{ __html: generateSvgString() }} />
          </AvatarFrame>
        </div>
        <span className="text-[11px] font-bold text-ludo-soft">معاينة حية داخل إطارك الحالي</span>
      </div>

      {/* شريط تبويبات التخصيص */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-black/40 p-1 border border-ludo-gold/20 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("color")}
          className={cn(
            "flex items-center justify-center gap-1 py-1.5 rounded-lg transition",
            activeTab === "color"
              ? "bg-ludo-gold text-black shadow"
              : "text-ludo-soft hover:text-white",
          )}
        >
          <Palette className="size-3.5" /> اللون
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("eyes")}
          className={cn(
            "flex items-center justify-center gap-1 py-1.5 rounded-lg transition",
            activeTab === "eyes"
              ? "bg-ludo-gold text-black shadow"
              : "text-ludo-soft hover:text-white",
          )}
        >
          <Eye className="size-3.5" /> العيون
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mouth")}
          className={cn(
            "flex items-center justify-center gap-1 py-1.5 rounded-lg transition",
            activeTab === "mouth"
              ? "bg-ludo-gold text-black shadow"
              : "text-ludo-soft hover:text-white",
          )}
        >
          <Smile className="size-3.5" /> التعبير
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("acc")}
          className={cn(
            "flex items-center justify-center gap-1 py-1.5 rounded-lg transition",
            activeTab === "acc"
              ? "bg-ludo-gold text-black shadow"
              : "text-ludo-soft hover:text-white",
          )}
        >
          <CrownIcon className="size-3.5" /> الإكسسوار
        </button>
      </div>

      {/* محتويات التبويب النشط */}
      <div className="min-h-[120px] rounded-xl bg-black/30 p-3 border border-white/10">
        {activeTab === "color" && (
          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-ludo-gold">
                لون الخلفية:
              </span>
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setBgColor(c)}
                    className={cn(
                      "size-7 rounded-full border-2 transition active:scale-90",
                      bgColor.id === c.id
                        ? "border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        : "border-black/50 opacity-80 hover:opacity-100",
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-ludo-soft">لون البشرة:</span>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.label}
                    onClick={() => setSkinTone(s)}
                    className={cn(
                      "size-7 rounded-full border-2 transition active:scale-90",
                      skinTone.id === s.id
                        ? "border-ludo-gold scale-110 shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                        : "border-black/50 opacity-80 hover:opacity-100",
                    )}
                    style={{ backgroundColor: s.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "eyes" && (
          <div className="grid grid-cols-4 gap-2">
            {EYE_STYLES.map((eye) => (
              <button
                key={eye.id}
                type="button"
                onClick={() => setEyeStyle(eye)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold transition active:scale-95",
                  eyeStyle.id === eye.id
                    ? "border-ludo-gold bg-ludo-gold/20 text-ludo-gold shadow-md"
                    : "border-white/10 bg-black/20 text-ludo-soft hover:border-ludo-gold/40",
                )}
              >
                <span className="text-base font-black">{eye.icon}</span>
                <span className="text-[10px] truncate max-w-full">{eye.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "mouth" && (
          <div className="grid grid-cols-4 gap-2">
            {MOUTH_STYLES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMouthStyle(m)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold transition active:scale-95",
                  mouthStyle.id === m.id
                    ? "border-ludo-gold bg-ludo-gold/20 text-ludo-gold shadow-md"
                    : "border-white/10 bg-black/20 text-ludo-soft hover:border-ludo-gold/40",
                )}
              >
                <span className="text-base">{m.icon}</span>
                <span className="text-[10px] truncate max-w-full">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "acc" && (
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccessory(a)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold transition active:scale-95",
                  accessory.id === a.id
                    ? "border-ludo-gold bg-ludo-gold/20 text-ludo-gold shadow-md"
                    : "border-white/10 bg-black/20 text-ludo-soft hover:border-ludo-gold/40",
                )}
              >
                <span className="text-base">{a.icon}</span>
                <span className="text-[10px] truncate max-w-full">{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center gap-2 pt-1">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 bg-black/40 text-xs font-bold text-ludo-soft hover:text-white"
          >
            إلغاء
          </Button>
        )}
        <Button
          type="button"
          variant="play"
          onClick={handleApply}
          className="flex-1 text-xs font-bold gap-2 py-2.5 shadow-lg shadow-amber-500/20"
        >
          <Check className="size-4" /> حفظ كصورتي الشخصية
        </Button>
      </div>
    </div>
  );
}

// دالة رسم العيون
function getEyesSvg(style: string) {
  switch (style) {
    case "happy":
      return `
        <path d="M37 53 Q42 47 47 53" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
        <path d="M53 53 Q58 47 63 53" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
      `;
    case "shades":
      return `
        <polygon points="32,48 48,48 45,58 35,58" fill="#111" stroke="#000" stroke-width="1.5" />
        <polygon points="52,48 68,48 65,58 55,58" fill="#111" stroke="#000" stroke-width="1.5" />
        <line x1="48" y1="51" x2="52" y2="51" stroke="#111" stroke-width="2.5" />
        <line x1="33" y1="50" x2="43" y2="56" stroke="#fff" stroke-width="1" opacity="0.6" />
      `;
    case "big":
      return `
        <ellipse cx="40" cy="52" rx="5" ry="6" fill="#0f172a" />
        <ellipse cx="60" cy="52" rx="5" ry="6" fill="#0f172a" />
        <circle cx="42" cy="50" r="2" fill="#fff" />
        <circle cx="62" cy="50" r="2" fill="#fff" />
      `;
    case "star":
      return `
        <text x="35" y="56" font-size="12" text-anchor="middle" fill="#EAB308">★</text>
        <text x="65" y="56" font-size="12" text-anchor="middle" fill="#EAB308">★</text>
      `;
    case "wink":
      return `
        <ellipse cx="40" cy="52" rx="4.5" ry="5.5" fill="#0f172a" />
        <circle cx="41.5" cy="50.5" r="1.5" fill="#fff" />
        <path d="M54 53 Q59 47 64 53" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
      `;
    case "goggles":
      return `
        <rect x="32" y="47" width="16" height="11" rx="4" fill="#06B6D4" stroke="#083344" stroke-width="2" />
        <rect x="52" y="47" width="16" height="11" rx="4" fill="#06B6D4" stroke="#083344" stroke-width="2" />
        <line x1="48" y1="52" x2="52" y2="52" stroke="#083344" stroke-width="2.5" />
        <line x1="28" y1="52" x2="32" y2="52" stroke="#083344" stroke-width="2" />
        <line x1="68" y1="52" x2="72" y2="52" stroke="#083344" stroke-width="2" />
      `;
    case "fierce":
      return `
        <polygon points="34,49 46,54 44,55 35,53" fill="#000" />
        <polygon points="66,49 54,54 56,55 65,53" fill="#000" />
        <line x1="33" y1="46" x2="46" y2="49" stroke="#000" stroke-width="2" stroke-linecap="round" />
        <line x1="67" y1="46" x2="54" y2="49" stroke="#000" stroke-width="2" stroke-linecap="round" />
      `;
    case "chill":
    default:
      return `
        <path d="M36 52 Q41 55 46 52" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
        <path d="M54 52 Q59 55 64 52" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
      `;
  }
}

// دالة رسم الفم
function getMouthSvg(style: string) {
  switch (style) {
    case "grin":
      return `
        <path d="M41 66 Q50 77 59 66 Z" fill="#DC2626" stroke="#000" stroke-width="1.5" />
        <path d="M43 66 Q50 71 57 66" fill="#fff" />
      `;
    case "smirk":
      return `
        <path d="M44 69 Q53 71 58 64" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
      `;
    case "tongue":
      return `
        <path d="M42 66 Q50 74 58 66" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" />
        <path d="M47 68 C47 75, 53 75, 53 68 Z" fill="#F43F5E" stroke="#000" stroke-width="1" />
      `;
    case "cheer":
      return `
        <circle cx="50" cy="69" r="6" fill="#991B1B" stroke="#000" stroke-width="1.5" />
      `;
    case "smile":
      return `
        <path d="M43 67 Q50 73 57 67" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
      `;
    case "cool":
      return `
        <line x1="44" y1="68" x2="56" y2="68" stroke="#000" stroke-width="2" stroke-linecap="round" />
      `;
    case "open":
      return `
        <ellipse cx="50" cy="68" rx="4" ry="5.5" fill="#450A0A" stroke="#000" stroke-width="1.5" />
      `;
    case "determined":
    default:
      return `
        <path d="M42 69 Q50 66 58 69" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
      `;
  }
}

// دالة رسم الإكسسوارات
function getAccessorySvg(style: string) {
  switch (style) {
    case "crown":
      return `
        <polygon points="34,36 40,24 50,30 60,24 66,36" fill="#FBBF24" stroke="#B45309" stroke-width="1.5" />
        <rect x="33" y="35" width="34" height="4" rx="1.5" fill="#F59E0B" stroke="#B45309" stroke-width="1" />
        <circle cx="40" cy="24" r="1.5" fill="#EF4444" />
        <circle cx="50" cy="30" r="1.5" fill="#3B82F6" />
        <circle cx="60" cy="24" r="1.5" fill="#10B981" />
      `;
    case "headset":
      return `
        <path d="M22 55 A28 28 0 0 1 78 55" fill="none" stroke="#334155" stroke-width="4.5" stroke-linecap="round" />
        <rect x="18" y="47" width="8" height="15" rx="3.5" fill="#EF4444" stroke="#1E293B" stroke-width="1.5" />
        <rect x="74" y="47" width="8" height="15" rx="3.5" fill="#EF4444" stroke="#1E293B" stroke-width="1.5" />
        <path d="M24 59 Q32 72 40 68" fill="none" stroke="#475569" stroke-width="2" />
        <circle cx="40" cy="68" r="2" fill="#000" />
      `;
    case "horns":
      return `
        <path d="M32 36 Q22 24 30 18 Q35 24 37 34" fill="#EF4444" stroke="#7F1D1D" stroke-width="1" />
        <path d="M68 36 Q78 24 70 18 Q65 24 63 34" fill="#EF4444" stroke="#7F1D1D" stroke-width="1" />
      `;
    case "bandana":
      return `
        <path d="M23 45 Q50 40 77 45 L76 50 Q50 45 24 50 Z" fill="#EF4444" stroke="#7F1D1D" stroke-width="1" />
        <rect x="44" y="41" width="12" height="6" rx="1" fill="#E2E8F0" stroke="#475569" stroke-width="1" />
      `;
    case "party":
      return `
        <polygon points="40,32 50,12 60,32" fill="#EC4899" stroke="#9D174D" stroke-width="1" />
        <circle cx="50" cy="12" r="2.5" fill="#FDE047" />
        <circle cx="48" cy="22" r="1.5" fill="#67E8F9" />
        <circle cx="53" cy="27" r="1.5" fill="#A7F3D0" />
      `;
    case "sparkles":
      return `
        <text x="24" y="32" font-size="11" fill="#FDE047">✨</text>
        <text x="70" y="34" font-size="11" fill="#FDE047">✨</text>
      `;
    case "none":
    default:
      return "";
  }
}
