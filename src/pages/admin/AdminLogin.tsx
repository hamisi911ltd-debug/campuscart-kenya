import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isMainDomain = hostname === "campusmart.co.ke" || hostname === "www.campusmart.co.ke" || hostname.includes("campusmart-kenya.pages.dev");
    if (isMainDomain) {
      setIsRedirecting(true);
      window.location.href = `https://admin.campusmart.co.ke/admin/login`;
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Check against the unique admin password
      const ADMIN_PASSWORD = "LUCYISOKORE@2026";
      
      if (password !== ADMIN_PASSWORD) {
        setError("Invalid password");
        toast.error('Invalid password');
        setIsLoading(false);
        return;
      }
      
      // Success - store session and redirect
      sessionStorage.setItem('isAdmin', 'true');
      sessionStorage.setItem('adminEmail', 'campusmart.care@gmail.com');
      toast.success('Welcome, Admin!');
      navigate("/admin");
      
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Redirecting to admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-white/80 text-sm">
            Enter the unique admin password to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-6">
            {/* Password Field */}
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                <Lock className="h-5 w-5 text-red-600" />
                Admin Password
              </label>
              <div className="relative">
                <input 
                  required 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter the unique admin password" 
                  className={`w-full rounded-2xl border-2 px-6 py-4 pr-14 text-lg transition-all focus:ring-4 focus:ring-red-500/20 outline-none ${
                    error 
                      ? "border-red-500 bg-red-50 focus:border-red-600" 
                      : "border-gray-300 bg-white hover:border-red-400 focus:border-red-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                  <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                  {error}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Shield className="h-5 w-5" />
                  Access Admin Dashboard
                </div>
              )}
            </button>

            {/* Security Info */}
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-200">
              <Shield className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">Secure Admin Portal • CampusMart Kenya</p>
            </div>
          </div>
        </form>

        {/* Back to Site */}
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate("/")}
            className="text-sm text-white/80 hover:text-white transition-colors font-medium"
          >
            ← Back to CampusMart
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
