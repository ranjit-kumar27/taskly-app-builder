import { ReactNode } from "react";
import { Code2, Eye, Wrench } from "lucide-react";
import { Logo } from "@/components/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const FEATURES = [
  { icon: Code2, title: "Streams code live", text: "Watch every file get written in real time." },
  { icon: Eye, title: "Instant preview", text: "Your app runs in the browser as it's built." },
  { icon: Wrench, title: "Self-repairing", text: "Runtime errors get fixed with one click." },
];

/** Split-screen auth: form on the left, product showcase on the right (lg+). */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Form side */}
      <div className="relative flex flex-col overflow-hidden px-4 py-5 sm:px-12 sm:py-6">
        {/* Colored glows give the glass card something to refract */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 30% at 30% 30%, hsl(262 70% 50% / 0.22), transparent 70%)," +
              "radial-gradient(34% 28% at 72% 62%, hsl(200 80% 45% / 0.16), transparent 70%)," +
              "radial-gradient(30% 25% at 40% 85%, hsl(165 60% 40% / 0.12), transparent 70%)",
          }}
        />
        <Logo className="relative" />

        <div className="relative flex flex-1 items-center justify-center py-12">
          <div className="liquid-glass w-full max-w-[420px] rounded-[28px] p-6 sm:p-10 animate-fade-in">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <p className="text-center text-sm text-muted-foreground">{footer}</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground/60">© {new Date().getFullYear()} Taskly</p>
      </div>

      {/* Showcase side */}
      <div className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-3xl border border-border bg-[#0d0d0d]">
          {/* Aurora + grid backdrop */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(60% 50% at 20% 10%, hsl(262 60% 35% / 0.55), transparent 70%)," +
                "radial-gradient(50% 45% at 85% 30%, hsl(200 70% 35% / 0.45), transparent 70%)," +
                "radial-gradient(60% 50% at 50% 100%, hsl(160 50% 25% / 0.45), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 bg-grid" />

          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI app builder
              </span>
              <h2 className="gradient-text mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                From a sentence to a running app.
              </h2>
            </div>

            {/* Mock: prompt -> preview */}
            <div className="relative mx-auto w-full max-w-lg py-10">
              <div className="surface relative z-10 rounded-2xl p-4">
                <p className="text-sm text-foreground/90">
                  Build a habit tracker with streaks and a weekly heatmap
                  <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground" />
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 font-mono">src/App.tsx</span>
                  <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 font-mono">HabitCard.tsx</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> writing
                  </span>
                </div>
              </div>

              <div className="-mt-3 ml-10 overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-border px-4 pb-2.5 pt-6">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="ml-3 h-4 flex-1 rounded-md bg-white/5" />
                </div>
                <div className="flex gap-5 p-5">
                  <div className="w-24 shrink-0 space-y-2.5">
                    <div className="h-2.5 w-16 rounded bg-white/20" />
                    <div className="h-2 w-full rounded bg-white/10" />
                    <div className="h-2 w-4/5 rounded bg-white/10" />
                    <div className="mt-4 text-2xl font-semibold text-white/90">12</div>
                    <div className="h-2 w-14 rounded bg-emerald-400/40" />
                  </div>
                  <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                    {Array.from({ length: 56 }, (_, i) => (
                      <span
                        key={i}
                        className="aspect-square rounded-[3px]"
                        style={{ background: `hsl(152 55% 45% / ${[0.1, 0.25, 0.5, 0.85, 0.15][(i * 7 + (i >> 3)) % 5]})` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon className="h-4 w-4 text-white/70" />
                  <p className="mt-3 text-sm font-medium text-white/90">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Input class shared by auth forms */
export const authInputClass =
  "pl-10 h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-sm shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] placeholder:text-muted-foreground/50 transition-colors focus-visible:border-white/20 focus-visible:bg-white/[0.06] focus-visible:ring-0 focus-visible:ring-offset-0";
