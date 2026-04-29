import { useState, useEffect, useCallback } from "react";
import { MapPin, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface LocationPickerProps {
  onLocationCapture: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number } | null;
  title?: string;
  description?: string;
}

export const LocationPicker = ({
  onLocationCapture,
  initialLocation = null,
  title = "Your Live Location",
  description = "Detecting your exact GPS location...",
}: LocationPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Define the function first using useCallback so it's stable
  const detectLocation = useCallback(() => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("not_supported");
      setLoading(false);
      toast.error("Your browser doesn't support location services.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        onLocationCapture(coords);
        setLoading(false);
        toast.success(`📍 Location captured! Accuracy: ~${Math.round(pos.coords.accuracy)}m`);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case 1: setError("denied"); break;       // PERMISSION_DENIED
          case 2: setError("unavailable"); break;  // POSITION_UNAVAILABLE
          case 3: setError("timeout"); break;      // TIMEOUT
          default: setError("unknown"); break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [onLocationCapture]);

  // Auto-trigger on mount
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    } else {
      detectLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openSettings = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      toast.info("Go to Settings → Privacy → Location Services → Enable for Safari");
    } else if (/android/.test(ua)) {
      toast.info("Go to Settings → Location → Turn on, then retry");
    } else {
      toast.info("Click the 🔒 lock icon in the address bar → Allow location");
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          {title}
        </h2>
        {location && (
          <button
            type="button"
            onClick={detectLocation}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            Update
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-accent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {description}
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
          {error === "denied" && (
            <>
              <p className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                🔒 Location Access Denied
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                We need your location for accurate delivery. Please enable it and try again.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openSettings}
                  className="w-full rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white transition"
                >
                  ⚙️ How to Enable Location
                </button>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="w-full rounded-lg border-2 border-red-500 text-red-600 dark:text-red-400 py-2 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  🔄 Try Again
                </button>
              </div>
            </>
          )}

          {error === "unavailable" && (
            <>
              <p className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                📡 GPS Signal Unavailable
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Your GPS is off or signal is weak. Enable GPS and move to an open area.
              </p>
              <div className="space-y-2">
                <button type="button" onClick={openSettings} className="w-full rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white transition">
                  Enable GPS / Location
                </button>
                <button type="button" onClick={detectLocation} className="w-full rounded-lg border-2 border-red-500 text-red-600 dark:text-red-400 py-2 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                  🔄 Try Again
                </button>
              </div>
            </>
          )}

          {(error === "timeout" || error === "unknown" || error === "not_supported") && (
            <>
              <p className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                {error === "timeout" ? "⏱️ Location Timed Out" : "❌ Location Error"}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {error === "timeout"
                  ? "GPS took too long. Check your signal and try again."
                  : "Unable to get your location. Ensure location services are enabled."}
              </p>
              <button type="button" onClick={detectLocation} className="w-full rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white transition">
                🔄 Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Success: Mini-map + coordinates */}
      {!loading && !error && location && (
        <div className="space-y-3">
          {/* The mini Google Maps iframe */}
          <div className="rounded-xl overflow-hidden border-2 border-accent shadow-md">
            <iframe
              src={`https://www.google.com/maps?q=${location.lat},${location.lng}&output=embed&z=18`}
              width="100%"
              height="200"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Your live location"
            />
          </div>

          {/* Coordinates badge */}
          <div className="flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                ✅ Live location captured!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 font-mono">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Idle state — only if no location, not loading, no error (shouldn't normally show since auto-triggers) */}
      {!loading && !error && !location && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>
          <button
            type="button"
            onClick={detectLocation}
            className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90 transition flex items-center justify-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Capture My Live Location
          </button>
        </div>
      )}
    </div>
  );
};
