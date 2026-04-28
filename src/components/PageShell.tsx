import type { ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PageShell = ({ title, children, back = true }: { title: string; children: ReactNode; back?: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex items-center gap-3">
          {back && (
            <button onClick={() => navigate(-1)} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
