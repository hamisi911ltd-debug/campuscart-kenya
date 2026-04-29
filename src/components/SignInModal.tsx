import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const SignInModal = ({ isOpen, onClose, message }: SignInModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/auth');
  };

  // Prevent closing by clicking backdrop or X button for product/checkout pages
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only allow closing on homepage
    if (message?.includes("Welcome to CampusMart")) {
      onClose();
    }
  };

  const showCloseButton = message?.includes("Welcome to CampusMart");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-3xl p-8 shadow-2xl border border-border max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Close Button - Only show on homepage */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Content */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            Sign in required
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6">
            {message || "Create an account or sign in to continue"}
          </p>

          {/* Benefits */}
          <div className="bg-accent/5 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-foreground mb-2">With an account you can:</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                View product details and prices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                Add items to cart and favorites
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                Place orders and track deliveries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                Sell your own items
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full rounded-xl gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Sign in / Create account
            </button>
            
            {/* Only show "Maybe later" on homepage */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Free to join • University verified • Secure
          </p>
        </div>
      </div>
    </div>
  );
};
