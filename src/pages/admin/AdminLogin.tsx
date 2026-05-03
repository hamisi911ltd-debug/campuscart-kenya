import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

// Admin credentials - loaded from environment variables
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "campusmart.care@gmail.com";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if we're on the correct domain and redirect if not
  useEffect(() => {
    const hostname = window.location.hostname;
    const isAdminDomain = hostname === "admin.campusmart.co.ke" || 
                         hostname === "localhost" ||
                         hostname === "127.0.0.1";
    
    const isMainDomain = hostname === "campusmart.co.ke" || 
                        hostname === "www.campusmart.co.ke" ||
                        hostname.includes("campusmart-kenya.pages.dev");
    
    if (isMainDomain) {
      setIsRedirecting(true);
      // Redirect to admin subdomain
      window.location.href = `https://admin.campusmart.co.ke/admin/login`;
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Welcome, Admin!');
        navigate("/admin");
      } else {
        setErrors({ 
          email: data.error || "Invalid credentials", 
          password: data.error || "Invalid credentials" 
        });
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show redirecting message if on wrong domain
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Redirecting to admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          </div>
          <p className="text-white/80 text-sm">
            Secure access to CampusMart Admin Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Admin Email
              </label>
              <input 
                required 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }}
                type="email" 
                placeholder="admin@campusmart.com" 
                className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-purple-500/40 outline-none ${
                  errors.email 
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-300 bg-white hover:border-purple-500/50"
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
                  placeholder="Enter admin password" 
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-all focus:ring-2 focus:ring-purple-500/40 outline-none ${
                    errors.password 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-purple-500/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in to Admin Dashboard"
              )}
            </button>

            {/* Security Info */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
              <Shield className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500">Secure admin access only</p>
            </div>
          </div>
        </form>

        {/* Back to Site */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate("/")}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            ← Back to CampusMart
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
