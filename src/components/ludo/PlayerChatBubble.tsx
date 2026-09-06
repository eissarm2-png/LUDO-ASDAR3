import React from "react";
import { cn } from "@/lib/utils";

export type ChatBubbleData = {
  id: string;
  text: string;
  kind: "text" | "quick" | "emoji" | "voice";
  author?: string;
};

type PlayerChatBubbleProps = {
  bubble?: ChatBubbleData | null;
  align?: "start" | "end" | "center";
  className?: string;
};

/**
 * فقاعة محادثة كرتونية ملكية تطفو فوق رأس الأفتار للاعب عند إرسال رسالة أو إيموجي.
 * تظهر لجميع اللاعبين في الغرفة فوق المقعد المناسب.
 */
export function PlayerChatBubble({ bubble, align = "center", className }: PlayerChatBubbleProps) {
  if (!bubble || !bubble.text) return null;

  const isEmoji =
    bubble.kind === "emoji" ||
    (bubble.text.length <= 4 &&
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(bubble.text));

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-[calc(100%+8px)] z-50 flex flex-col select-none",
        "animate-in zoom-in-75 fade-in slide-in-from-bottom-2 duration-200",
        align === "start" && "start-0 items-start",
        align === "end" && "end-0 items-end",
        align === "center" && "left-1/2 -translate-x-1/2 items-center",
        className,
      )}
      dir="rtl"
    >
      {/* جسم الفقاعة */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border-2 border-amber-400 font-bold",
          "shadow-[0_8px_25px_rgba(0,0,0,0.7),0_0_12px_rgba(255,215,0,0.45)]",
          isEmoji
            ? "rounded-full bg-gradient-to-b from-white via-amber-50 to-amber-100 px-3 py-1"
            : "rounded-2xl bg-gradient-to-b from-[#ffffff] via-[#fffdf5] to-[#fcf6e0] px-3 py-1.5",
        )}
      >
        {/* لمعان خفيف أعلى الفقاعة */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent" />

        {isEmoji ? (
          <span className="relative z-10 text-2xl sm:text-3xl leading-none animate-bounce drop-shadow-sm select-none">
            {bubble.text}
          </span>
        ) : (
          <p className="relative z-10 text-center font-sans text-xs sm:text-sm font-black leading-snug text-slate-900 max-w-[150px] sm:max-w-[200px] break-words whitespace-pre-wrap select-none">
            {bubble.text}
          </p>
        )}
      </div>

      {/* ذيل الفقاعة المؤشر لأسفل باتجاه رأس الأفتار */}
      <div
        className={cn(
          "size-0 -mt-[1px] border-x-[6px] border-x-transparent border-t-[7px] border-t-amber-400 drop-shadow-sm",
          align === "start" && "ms-4",
          align === "end" && "me-4",
          align === "center" && "self-center",
        )}
      />
    </div>
  );
}
