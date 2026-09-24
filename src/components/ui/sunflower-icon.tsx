import { cn } from "@/lib/utils/cn";

interface SunflowerIconProps {
  className?: string;
  /** Petal + center colours; defaults follow the brand palette. */
  petalColor?: string;
  centerColor?: string;
  title?: string;
}

const PETAL_COUNT = 10;

/**
 * Minimalist sunflower: 10 rounded petals around a solid centre.
 * Deliberately low-detail so it stays legible at favicon size.
 */
export function SunflowerIcon({
  className,
  petalColor = "var(--color-primary)",
  centerColor = "var(--color-primary-deep)",
  title,
}: SunflowerIconProps) {
  const petals = Array.from({ length: PETAL_COUNT }, (_, index) => (index * 360) / PETAL_COUNT);

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <g>
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx="24"
            cy="10.5"
            rx="4.1"
            ry="8"
            fill={petalColor}
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="7.4" fill={centerColor} />
    </svg>
  );
}
