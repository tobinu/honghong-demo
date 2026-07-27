"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
    blur?: number;
    inactiveZone?: number;
    proximity?: number;
    spread?: number;
    variant?: "default" | "white";
    glow?: boolean;
    className?: string;
    disabled?: boolean;
    movementDuration?: number;
    borderWidth?: number;
}

const GlowingEffect = memo(
    ({
        blur = 0,
        inactiveZone = 0.01,
        proximity = 100,
        spread = 40,
        variant = "default",
        glow = true,
        className,
        movementDuration = 0.15,
        borderWidth = 2,
        disabled = false,
    }: GlowingEffectProps) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const angleRef = useRef(0);
        const [angle, setAngle] = useState(0);
        const [isActive, setIsActive] = useState(false);
        const animationRef = useRef<number>(0);

        const handlePointerMove = useCallback(
            (e: PointerEvent) => {
                if (disabled || !containerRef.current) return;

                const element = containerRef.current;
                const rect = element.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const isWithinProximity =
                    mouseX > rect.left - proximity &&
                    mouseX < rect.right + proximity &&
                    mouseY > rect.top - proximity &&
                    mouseY < rect.bottom + proximity;

                if (!isWithinProximity) {
                    setIsActive(false);
                    return;
                }

                setIsActive(true);

                const targetAngle =
                    Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI) + 90;

                const currentAngle = angleRef.current;
                let diff = targetAngle - currentAngle;

                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                const newAngle = currentAngle + diff * 0.15;
                angleRef.current = newAngle;
                setAngle(newAngle);
            },
            [disabled, proximity]
        );

        useEffect(() => {
            if (disabled) return;

            const handleMove = (e: PointerEvent) => {
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                animationRef.current = requestAnimationFrame(() => handlePointerMove(e));
            };

            document.addEventListener("pointermove", handleMove, { passive: true });
            return () => {
                document.removeEventListener("pointermove", handleMove);
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            };
        }, [handlePointerMove, disabled]);

        const gradientColors =
            variant === "white"
                ? "rgba(255,255,255,0.9), rgba(255,255,255,0.5), rgba(255,255,255,0.1), transparent"
                : "#ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b";

        return (
            <div
                ref={containerRef}
                className={cn(
                    "pointer-events-none absolute inset-0 overflow-visible rounded-[inherit]",
                    className
                )}
            >
                {/* 主发光边框：CSS mask 技术只显示边框区域 */}
                <div
                    className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
                    style={{
                        background: `conic-gradient(from ${angle}deg at 50% 50%, ${gradientColors})`,
                        opacity: isActive ? 1 : 0,
                        filter: blur > 0 ? `blur(${blur}px)` : undefined,
                        padding: `${borderWidth}px`,
                        WebkitMask:
                            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor" as string,
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude" as string,
                    } as React.CSSProperties}
                />

                {/* 柔和外围光晕 */}
                {glow && (
                    <div
                        className="absolute -inset-2 rounded-[inherit] transition-opacity duration-500"
                        style={{
                            background: `conic-gradient(from ${angle}deg at 50% 50%, ${gradientColors})`,
                            filter: "blur(12px)",
                            opacity: isActive ? 0.6 : 0,
                        }}
                    />
                )}

                {/* 更远的氛围光晕 */}
                {glow && (
                    <div
                        className="absolute -inset-4 rounded-[inherit] transition-opacity duration-700"
                        style={{
                            background: `conic-gradient(from ${angle}deg at 50% 50%, ${gradientColors})`,
                            filter: "blur(25px)",
                            opacity: isActive ? 0.3 : 0,
                        }}
                    />
                )}
            </div>
        );
    }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
