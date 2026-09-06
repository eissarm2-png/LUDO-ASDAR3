import React from "react";
import { Crown } from "lucide-react";
import diceRoyal from "@/assets/dice-royal.png";
import { cn } from "@/lib/utils";

interface AnimatedRoyalDiceProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showCrown?: boolean;
  showGlow?: boolean;
  title?: string;
}

export function AnimatedRoyalDice({
  size = "md",
  className,
  showCrown = true,
  showGlow = true,
  title = "نرد لودو الملكي المتحرك",
}: AnimatedRoyalDiceProps) {
  // الحجم حسب الفئة
  const dimensions = {
    xs: {
      box: "size-7",
      crownBox: "size-3.5 -top-1",
      crownIcon: "size-2",
      glowSpread: "-m-2",
      pingSpread: "-m-1",
    },
    sm: {
      box: "size-12",
      crownBox: "size-5 -top-1.5",
      crownIcon: "size-3",
      glowSpread: "-m-3",
      pingSpread: "-m-1.5",
    },
    md: {
      box: "size-16 sm:size-20",
      crownBox: "size-7 -top-2",
      crownIcon: "size-4",
      glowSpread: "-m-4",
      pingSpread: "-m-2",
    },
    lg: {
      box: "size-24 sm:size-28",
      crownBox: "size-8 sm:size-9 -top-2.5 sm:-top-3",
      crownIcon: "size-4 sm:size-5",
      glowSpread: "-m-5 sm:-m-6",
      pingSpread: "-m-2 sm:-m-3",
    },
    xl: {
      box: "size-32 sm:size-36",
      crownBox: "size-9 sm:size-10 -top-3 sm:-top-3.5",
      crownIcon: "size-5",
      glowSpread: "-m-6",
      pingSpread: "-m-2",
    },
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none pt-1.5 sm:pt-2 mt-0.5 sm:mt-1 translate-y-1",
        className,
      )}
      title={title}
      aria-label={title}
    >
      {/* هالة التوهج الدائرية خلف النرد */}
      {showGlow && (
        <>
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-amber-500/35 blur-xl animate-pulse pointer-events-none",
              dimensions.glowSpread,
            )}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full border border-amber-400/50 animate-ping opacity-25 pointer-events-none",
              dimensions.pingSpread,
            )}
          />
        </>
      )}

      {/* تصميم النرد مع دوران وحركة تذبذب ملكية ثلاثية الأبعاد محسوبة بدقة */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform",
          dimensions.box,
        )}
      >
        <div className="relative size-full animate-royal-bounce">
          <img
            src={diceRoyal}
            alt={title}
            className="size-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-110 animate-[spin_6s_linear_infinite]"
          />

          {/* شعار التاج الصغير فوق النرد */}
          {showCrown && (
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 grid place-items-center rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-black shadow-[0_2px_8px_rgba(0,0,0,0.6)] border border-yellow-100 z-10",
                dimensions.crownBox,
              )}
            >
              <Crown className={cn("text-[#25061f] drop-shadow-sm", dimensions.crownIcon)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
