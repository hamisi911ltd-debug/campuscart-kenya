import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Eye, EyeOff, Mail, User, Lock, Phone } from "lucide-react";
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

  const handleGoogleSignIn = async () => {
    try {
      // Fetch Google Client ID from backend
      const configRes = await fetch('/api/config/google');
      const config = await configRes.json();
      const clientId = config.clientId;
      
      const redirectUri = `${window.location.origin}/auth/google-callback`;
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set("prompt", "select_account");
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Failed to initiate Google Sign-In:', error);
      toast.error("Failed to start Google Sign-In. Please try again.");
    }
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
      <div className="bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-md mx-auto px-4 pb-6">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-base text-foreground">
              {mode === "signin" 
                ? "Sign in to your account" 
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
                className={`w-full mt-6 rounded-xl py-3.5 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  mode === "signin" 
                    ? "gradient-accent text-accent-foreground" 
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </div>
                ) : (
                  mode === "signin" ? "Sign in" : "Create account"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-background hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-foreground">Continue with Google</span>
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
                    ? <span>New to CampusMart? <span className="text-green-600 font-semibold">Create account</span></span>
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default AuthPage;
