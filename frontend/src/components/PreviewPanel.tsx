import { useState, useEffect } from "react";
import { Play, Loader2, ExternalLink, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, PREVIEW_URL_KEY } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";

interface PreviewPanelProps {
  projectId: string;
  runtimeError: RuntimeError | null;
  onDismiss: () => void;
  onFix: (error: RuntimeError) => void;
}

export function PreviewPanel({ projectId, runtimeError, onDismiss, onFix }: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    // Load from localStorage on mount
    return localStorage.getItem(`${PREVIEW_URL_KEY}:${projectId}`);
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  // Store previewUrl in localStorage when it changes
  useEffect(() => {
    if (previewUrl) {
      localStorage.setItem(`${PREVIEW_URL_KEY}:${projectId}`, previewUrl);
    }
  }, [previewUrl, projectId]);

  const handleDeploy = async () => {
    setIsDeploying(true);

    try {
      const response = await api.deploy(projectId);
      setPreviewUrl(response.previewUrl);
      toast({
        title: "Deployment successful",
        description: "Your preview is now ready",
      });
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRefresh = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Browser-style toolbar */}
      <div className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-white/[0.06] sm:gap-3 sm:px-4">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>

        <div className="liquid-glass mx-auto flex h-8 w-full max-w-md items-center gap-2 rounded-full pl-1 pr-3 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!previewUrl}
            title="Reload"
            className="h-6 w-6 shrink-0 rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", previewUrl ? "bg-emerald-400" : "bg-white/20")} />
          <span className="flex-1 truncate text-center">
            {previewUrl ? previewUrl.replace(/^https?:\/\//, "") : "Not running"}
          </span>
          {previewUrl && (
            <button onClick={() => window.open(previewUrl, "_blank")} title="Open in new tab" className="shrink-0 transition-colors hover:text-foreground">
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          size="sm"
          className="h-8 shrink-0 rounded-full px-3.5 text-[13px]"
        >
          {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {isDeploying ? "Starting…" : previewUrl ? "Redeploy" : "Run"}
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="liquid-glass mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Globe className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Nothing running yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Start a live preview to see your app here as it's being built.
            </p>
            <Button onClick={handleDeploy} disabled={isDeploying} variant="ghost" className="liquid-glass mt-6 h-9 rounded-full px-5 text-[13px] hover:bg-white/10">
              {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run preview
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert Overlay - Inside the Preview Panel */}
      <RuntimeErrorAlert
        error={runtimeError}
        onDismiss={onDismiss}
        onFix={onFix}
      />
    </div>
  );
}
