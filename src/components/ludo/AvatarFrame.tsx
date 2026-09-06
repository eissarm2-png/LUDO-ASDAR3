import React from "react";
import { getFrameById } from "@/lib/avatar-frames";
import { cn } from "@/lib/utils";
import avatarTiger from "@/assets/avatar-tiger.png";

type AvatarFrameProps = {
  frameId?: string | null | undefined;
  avatar?: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number | undefined;
  className?: string | undefined;
  showBadge?: boolean | undefined;
  children?: React.ReactNode | undefined;
  onClick?: (() => void) | undefined;
};

const SIZE_MAP = {
  xs: { box: "size-7", badge: "text-[10px] -top-1 -end-1 size-3.5", font: "text-xs" },
  sm: { box: "size-9", badge: "text-xs -top-1 -end-1 size-4", font: "text-sm" },
  md: { box: "size-12", badge: "text-xs -top-1 -end-1 size-5", font: "text-base" },
  lg: { box: "size-16", badge: "text-sm -top-1.5 -end-1.5 size-6", font: "text-xl" },
  xl: { box: "size-20", badge: "text-base -top-2 -end-2 size-7", font: "text-2xl" },
  "2xl": { box: "size-24", badge: "text-lg -top-2.5 -end-2.5 size-8", font: "text-3xl" },
};

export function AvatarFrame({
  frameId,
  avatar,
  size = "md",
  className,
  showBadge = true,
  children,
  onClick,
}: AvatarFrameProps) {
  const frame = getFrameById(frameId);

  const sizeKey = typeof size === "string" ? size : "md";
  const sizeConfig = SIZE_MAP[sizeKey] || SIZE_MAP.md;

  const customStyle: React.CSSProperties = {
    boxShadow: frame.glowStyle,
  };

  if (typeof size === "number") {
    customStyle.width = `${size}px`;
    customStyle.height = `${size}px`;
  }

  const renderContent = () => {
    if (children) return children;

    if (!avatar) {
      return (
        <img src={avatarTiger} alt="Avatar" className="size-full object-cover" loading="lazy" />
      );
    }

    if (
      avatar.startsWith("data:") ||
      avatar.startsWith("http://") ||
      avatar.startsWith("https://")
    ) {
      return <img src={avatar} alt="Avatar" className="size-full object-cover" loading="lazy" />;
    }

    // SVG string or raw character / emoji
    if (avatar.startsWith("<svg")) {
      return (
        <span
          className="size-full inline-flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: avatar }}
        />
      );
    }

    return <span className={cn("select-none font-bold", sizeConfig.font)}>{avatar}</span>;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full shrink-0 flex items-center justify-center p-[2px] transition-transform",
        typeof size === "string" ? sizeConfig.box : "",
        frame.borderClass,
        frame.animationClass,
        onClick && "cursor-pointer active:scale-95 hover:scale-105",
        className,
      )}
      style={customStyle}
    >
      {/* خلفية الإطار بتدرج مميز */}
      <div
        className={cn(
          "size-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br",
          frame.gradient,
        )}
      >
        {renderContent()}
      </div>

      {/* شارة الإطار الصغيرة في الزاوية */}
      {showBadge && frame.badgeIcon && (
        <span
          className={cn(
            "absolute z-10 flex items-center justify-center rounded-full bg-black/85 border border-white/30 shadow-md",
            sizeConfig.badge,
          )}
          style={{ borderColor: frame.accentHex }}
          title={frame.title}
        >
          {frame.badgeIcon}
        </span>
      )}
    </div>
  );
}
