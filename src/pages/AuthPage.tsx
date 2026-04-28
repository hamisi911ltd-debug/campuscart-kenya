import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";

const AuthPage = () => {
  const { signIn } = useShop();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const finalName = name || email.split("@")[0] || "Student";
    signIn(finalName, email || "student@uon.ac.ke");
    navigate("/profile");
  };

  return (
    <PageShell title={mode === "signin" ? "Sign in" : "Create account"}>
      <form onSubmit={submit} className="mx-auto grid max-w-md gap-3 rounded-2xl bg-card p-6 shadow-elevated">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
        )}
        <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="University email (e.g. you@students.uon.ac.ke)" className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
        <input required type="password" placeholder="Password" className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
        <button className="mt-1 rounded-full gradient-accent py-2.5 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.01] transition">
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-center text-xs text-muted-foreground hover:text-accent">
          {mode === "signin" ? "New to CampusMart? Create account" : "Already have an account? Sign in"}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">Verified by your university email · M-PESA enabled</p>
      </form>
    </PageShell>
  );
};

export default AuthPage;
