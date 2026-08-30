import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Phone, KeyRound, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    setError("");

    if (!/^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''))) {
      setError("Please enter a valid Kenyan phone number");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      toast.success("Code sent! Check your WhatsApp.");
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestCode();
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Enter the code we sent to your WhatsApp");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, code, new_password: newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success("Password reset! Please sign in.");
      navigate("/auth");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell title="" seoTitle="Forgot Password" noIndex>
      <div className="bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-md mx-auto px-4 pb-6">
          {/* Header — same logo treatment as the Sign In page */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4">
              <Logo />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "phone"
                ? "We'll send a code to your WhatsApp"
                : "Enter the code and choose a new password"}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handleRequestCodeSubmit} className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    type="tel"
                    placeholder="+254 712 345 678 or 0712 345 678"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-accent/40 hover:border-accent/50"
                  />
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> Must be the phone number on your account
                  </p>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending code...
                    </div>
                  ) : (
                    "Send code via WhatsApp"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                    Back to sign in
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    WhatsApp Code
                  </label>
                  <input
                    required
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(""); }}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Enter the 6-digit code"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg font-mono tracking-widest outline-none transition-all focus:ring-2 focus:ring-accent/40 hover:border-accent/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      required
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a new password"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition-all focus:ring-2 focus:ring-accent/40 hover:border-accent/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm New Password
                  </label>
                  <input
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-accent/40 hover:border-accent/50"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Resetting...
                    </div>
                  ) : (
                    "Reset password"
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Change phone number
                  </button>
                  <button
                    type="button"
                    onClick={() => requestCode()}
                    disabled={isLoading}
                    className="font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPasswordPage;
