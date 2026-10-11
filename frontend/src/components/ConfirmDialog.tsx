import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { CircleHelp, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Red styling for irreversible actions (delete, remove…) */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Drop-in replacement for window.confirm():
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete project?", destructive: true }))) return;
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

/** Renders one shared confirm modal for the whole app. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the content doesn't vanish mid exit-animation
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    resolveRef.current?.(false); // a newer request supersedes an unanswered one
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOpen(false);
  };

  const Icon = options.destructive ? TriangleAlert : CircleHelp;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(next) => !next && settle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <span
              className={cn(
                "mb-2 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset",
                options.destructive
                  ? "bg-red-500/10 text-red-400 ring-red-500/20"
                  : "bg-white/[0.06] text-foreground/80 ring-white/10"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <AlertDialogTitle className="text-xl">{options.title}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription className="leading-relaxed">{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-1">
            <AlertDialogCancel>{options.cancelText ?? "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settle(true)}
              className={cn(options.destructive && "bg-red-500 text-white hover:bg-red-500/90")}
            >
              {options.confirmText ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
