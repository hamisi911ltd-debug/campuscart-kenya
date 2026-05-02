import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "@/store/shop";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { signIn } = useShop();
  const [error, setError] = useState("");

  useEffect(() => {
    async function exchangeCode() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        setError("Google sign-in was cancelled.");
        return;
      }
      if (!code) {
        setError("No authorization code received.");
        return;
      }

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/google-callback`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Sign in using the shop context
          signIn(
            data.user.full_name,
            data.user.email,
            data.user.phone_number,
            data.user.profile_image_url,
            data.user.location,
            data.user.id
          );
          navigate("/", { replace: true });
        } else {
          const data = await res.json();
          setError(data.error || "Sign-in failed. Please try again.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
    exchangeCode();
  }, [navigate, signIn]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign-in Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <a 
            href="/auth" 
            className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
