/** اهتزاز الجهاز (Vibration API) مع تفضيل محلي قابل للإيقاف */

const KEY = "abqor-haptics";
let enabled = true;

export function loadHaptics(): boolean {
  if (typeof window === "undefined") return true;
  enabled = window.localStorage.getItem(KEY) !== "0";
  return enabled;
}

export function setHaptics(value: boolean) {
  enabled = value;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, value ? "1" : "0");
}

function buzz(pattern: number | number[]) {
  if (!enabled || typeof navigator === "undefined") return;
  const vib = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate;
  if (typeof vib !== "function") return;
  try {
    vib.call(navigator, pattern as never);
  } catch {
    /* الجهاز لا يدعم الاهتزاز */
  }
}

/** أنماط الاهتزاز مضبوطة على توقيت كل انتقال في المباراة */
export const haptics = {
  tap: () => buzz(10),
  click: () => buzz(10),
  button: () => buzz(12),
  selection: () => buzz(8),
  impact: (style?: "light" | "medium" | "heavy" | "soft" | "rigid" | string) => {
    switch (style) {
      case "light":
      case "soft":
        buzz(10);
        break;
      case "heavy":
      case "rigid":
        buzz(30);
        break;
      case "medium":
      default:
        buzz(20);
        break;
    }
  },
  notification: (type?: "success" | "warning" | "error" | string) => {
    switch (type) {
      case "success":
        buzz([0, 15, 50, 20]);
        break;
      case "warning":
        buzz([0, 30, 40, 30]);
        break;
      case "error":
        buzz([0, 40, 40, 40, 40, 50]);
        break;
      default:
        buzz(20);
        break;
    }
  },
  /** طول اللف 620ms: نبضات متسارعة ثم نبضة استقرار */
  diceRoll: () => buzz([0, 26, 70, 22, 70, 18, 70, 14, 90, 34]),
  roll: () => buzz([0, 26, 70, 22, 70, 18, 70, 14, 90, 34]),
  diceLand: () => buzz(22),
  dice: () => buzz(22),
  /** دخول قطعة عند 6 */
  enter: () => buzz([0, 18, 60, 40]),
  move: () => buzz(14),
  capture: () => buzz([0, 46, 60, 90]),
  home: () => buzz([0, 30, 50, 30, 50, 70]),
  turnPass: () => buzz(12),
  win: () => buzz([0, 90, 90, 90, 90, 200]),
  vibrate: (pattern: number | number[]) => buzz(pattern),
};
