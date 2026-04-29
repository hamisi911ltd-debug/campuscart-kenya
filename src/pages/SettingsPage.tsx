import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Bell, Globe, Lock, Moon, Shield, User, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SettingsPage = () => {
  const { user } = useShop();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('notifications_enabled') !== 'false';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('email_notifications_enabled') !== 'false';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true';
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'English';
  });
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // PWA Install detection
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!user) {
    return (
      <PageShell title="Settings">
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Sign in to access settings.</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 inline-block rounded-full gradient-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-accent"
          >
            Sign in
          </button>
        </div>
      </PageShell>
    );
  }

  const handleSaveSettings = () => {
    localStorage.setItem('notifications_enabled', String(notifications));
    localStorage.setItem('email_notifications_enabled', String(emailNotifications));
    localStorage.setItem('dark_mode', String(darkMode));
    localStorage.setItem('language', language);
    toast.success("Settings saved successfully!");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // In a real app, this would verify current password and update in backend
    // For now, just simulate success
    toast.success("Password changed successfully!");
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleInstallApp = async () => {
    if (isIOS) {
      toast.info("To install on iPhone: Tap Share (⎙) → Add to Home Screen");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success("App installed successfully!");
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } else {
      toast.info("App is already installed or not available for installation");
    }
  };

  return (
    <PageShell title="Settings">
      <div className="space-y-4">
        {/* Account Settings */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Account Settings</h2>
              <p className="text-xs text-muted-foreground">Manage your account information</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={user.name}
                readOnly
                className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <input
                type="tel"
                value={user.phone || "Not provided"}
                readOnly
                className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the phone number linked to your account
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Notifications</h2>
              <p className="text-xs text-muted-foreground">Manage how you receive updates</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Push Notifications</div>
                <div className="text-xs text-muted-foreground">Get notified about orders and messages</div>
              </div>
              <button
                onClick={() => {
                  const newValue = !notifications;
                  setNotifications(newValue);
                  localStorage.setItem('notifications_enabled', String(newValue));
                  toast.success(newValue ? "Push notifications enabled" : "Push notifications disabled");
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">Receive updates via email</div>
              </div>
              <button
                onClick={() => {
                  const newValue = !emailNotifications;
                  setEmailNotifications(newValue);
                  localStorage.setItem('email_notifications_enabled', String(newValue));
                  toast.success(newValue ? "Email notifications enabled" : "Email notifications disabled");
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Moon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Appearance</h2>
              <p className="text-xs text-muted-foreground">Customize how the app looks</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Dark Mode</div>
                <div className="text-xs text-muted-foreground">Switch to dark theme</div>
              </div>
              <button
                onClick={() => {
                  const newValue = !darkMode;
                  setDarkMode(newValue);
                  localStorage.setItem('dark_mode', String(newValue));
                  toast.success(newValue ? "Dark mode enabled" : "Dark mode disabled");
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Language</h2>
              <p className="text-xs text-muted-foreground">Choose your preferred language</p>
            </div>
          </div>

          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              localStorage.setItem('language', newLang);
              toast.success(`Language changed to ${newLang}`);
            }}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="English">English</option>
            <option value="Swahili">Swahili</option>
            <option value="Kikuyu">Kikuyu</option>
            <option value="Luo">Luo</option>
          </select>
        </div>

        {/* Privacy & Security */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Privacy & Security</h2>
              <p className="text-xs text-muted-foreground">Manage your privacy settings</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full flex items-center justify-between rounded-xl bg-muted p-3 text-sm font-medium hover:bg-secondary transition"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </span>
              <span className="text-muted-foreground">{showPasswordForm ? '−' : '+'}</span>
            </button>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 rounded-xl gradient-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="rounded-xl bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => toast.info("Privacy settings coming soon!")}
              className="w-full flex items-center justify-between rounded-xl bg-muted p-3 text-sm font-medium hover:bg-secondary transition"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="w-full rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition-transform"
        >
          Save Settings
        </button>

        {/* Install App Section - At Bottom */}
        {!isInstalled && (
          <div className="rounded-2xl bg-gradient-to-r from-accent to-green-600 p-5 shadow-card text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">Install CampusMart App</h2>
                <p className="text-xs opacity-90">Get quick access from your home screen</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Faster access</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>No app store needed</span>
              </div>
            </div>

            {isIOS ? (
              <div className="rounded-xl bg-white/10 p-3 text-xs space-y-1">
                <p className="font-semibold">To install on iPhone:</p>
                <p>1. Tap Share (⎙) in Safari</p>
                <p>2. Tap "Add to Home Screen"</p>
                <p>3. Tap "Add"</p>
              </div>
            ) : (
              <button
                onClick={handleInstallApp}
                className="w-full rounded-xl bg-white text-accent px-6 py-3 text-sm font-bold hover:bg-white/90 transition"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Install App Now
              </button>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SettingsPage;
