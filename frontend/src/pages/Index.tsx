import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on auth status
    if (isAuthenticated()) {
      // If authenticated, redirect to projects dashboard
      navigate("/projects");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 bg-spotlight" />
      <div className="relative flex flex-col items-center gap-4">
        <Logo className="text-xl" />
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
};

export default Index;
