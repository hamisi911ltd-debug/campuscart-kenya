import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Eye, EyeOff, Mail, User, Lock, Shield, Smartphone, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const AuthPage = () => {
  const { signIn } = useShop();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === "signup" && !name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }

    if (mode === "signup" && !phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (mode === "signup" && phone && !/^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid Kenyan phone number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup" && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // ALWAYS use database API (both production and development)
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'signup' 
        ? { email, password, full_name: name, phone_number: phone }
        : { email, password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Sign in with user data from database
      signIn(
        data.user.full_name, 
        data.user.email, 
        data.user.phone_number,
        data.user.profile_image_url,
        data.user.location,
        data.user.id  // Pass user ID from database
      );
      
      // Set flag to trigger notifications
      sessionStorage.setItem('campusmart_just_logged_in', 'true');
      
      toast.success(`Account ${mode === 'signup' ? 'created' : 'signed in'} successfully!`);
      navigate("/profile");
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell title="">
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mode === "signin" ? "Welcome back!" : "Join CampusMart"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signin" 
                ? "Sign in to your account to continue" 
                : "Create your account to start shopping"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
            <div className="space-y-5">
              {/* Name Field (Sign Up Only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <input 
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    placeholder="Enter your full name" 
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-accent/40 outline-none ${
                      errors.name 
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                        : "border-border bg-background hover:border-accent/50"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  University Email
                </label>
                <input 
                  required 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  type="email" 
                  placeholder="you@students.uon.ac.ke" 
                  className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-accent/40 outline-none ${
                    errors.email 
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                      : "border-border bg-background hover:border-accent/50"
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Phone Field (Sign Up Only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input 
                    required 
                    value={phone} 
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                    }}
                    type="tel" 
                    placeholder="+254 712 345 678 or 0712 345 678" 
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-accent/40 outline-none ${
                      errors.phone 
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                        : "border-border bg-background hover:border-accent/50"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                  <p className="text-xs text-muted-foreground">For M-PESA payments and order notifications</p>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="relative">
                  <input 
                    required 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                    }}
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-all focus:ring-2 focus:ring-accent/40 outline-none ${
                      errors.password 
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                        : "border-border bg-background hover:border-accent/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input 
                      required 
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }}
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-all focus:ring-2 focus:ring-accent/40 outline-none ${
                        errors.confirmPassword 
                          ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                          : "border-border bg-background hover:border-accent/50"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 rounded-xl gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin"></div>
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </div>
                ) : (
                  mode === "signin" ? "Sign in" : "Create account"
                )}
              </button>

              {/* Mode Toggle */}
              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setErrors({});
                    setPassword("");
                    setConfirmPassword("");
                    setPhone("");
                  }}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {mode === "signin" 
                    ? "New to CampusMart? Create account" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>

              {/* Security Info */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  University verified
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Smartphone className="h-3 w-3" />
                  M-PESA enabled
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default AuthPage;
