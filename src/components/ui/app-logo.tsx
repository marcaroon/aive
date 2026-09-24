import { SunflowerIcon } from "./sunflower-icon";
import { cn } from "@/lib/utils/cn";
import { APP_TAGLINE } from "@/lib/copy";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const SIZES = {
  sm: { icon: "h-6 w-6", name: "text-lg" },
  md: { icon: "h-8 w-8", name: "text-2xl" },
  lg: { icon: "h-12 w-12", name: "text-4xl" },
} as const;

export function AppLogo({ className, size = "md", showTagline = false }: AppLogoProps) {
  const sizes = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SunflowerIcon className={sizes.icon} title="Aivé" />
      <div className="leading-tight">
        <span className={cn("font-semibold tracking-tight text-[var(--color-ink)]", sizes.name)}>
          Aivé
        </span>
        {showTagline ? (
          <p className="text-xs text-[var(--color-muted)]">{APP_TAGLINE}</p>
        ) : null}
      </div>
    </div>
  );
}
