import { cn } from "@/lib/utils";

/** Taskly mark: monochrome tile with a split "T" (crossbar and stem separated by a hairline gap). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <rect x="8" y="8.5" width="16" height="4.5" rx="2.25" className="fill-background" />
      <rect x="13.75" y="15" width="4.5" height="9.5" rx="2.25" className="fill-background" />
    </svg>
  );
}

/** Mark plus optional "Taskly" wordmark */
export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark />
      {showText && <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">Taskly</span>}
    </span>
  );
}
