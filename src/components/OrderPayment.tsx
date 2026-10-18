import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";

type Phase = "idle" | "sending" | "waiting" | "paid" | "failed" | "timeout";

interface OrderPaymentProps {
  orderId: string;
  /** Send the M-Pesa prompt as soon as this appears (right after Place Order). */
  autoStart?: boolean;
  onPaid?: () => void;
}

const POLL_MS = 4000;
const GIVE_UP_MS = 3 * 60 * 1000;

/** Sends the customer's M-Pesa prompt for an order and follows it until it is paid, failed or times out. */
export const OrderPayment = ({ orderId, autoStart = false, onPaid }: OrderPaymentProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const timer = useRef<number | null>(null);
  const started = useRef(false);

  const stopPolling = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const follow = useCallback(() => {
    stopPolling();
    const startedAt = Date.now();
    timer.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payhero/order-status?order_id=${orderId}`, { cache: "no-store" });
        const data = await res.json();
        if (data.payment_status === "paid") {
          stopPolling();
          setPhase("paid");
          onPaid?.();
          return;
        }
        if (data.payment_status === "failed") {
          stopPolling();
          setPhase("failed");
          return;
        }
      } catch { /* network blip - keep trying */ }
      if (Date.now() - startedAt > GIVE_UP_MS) {
        stopPolling();
        setPhase("timeout");
      }
    }, POLL_MS);
  }, [orderId, onPaid]);

  const pay = useCallback(async () => {
    setError("");
    setPhase("sending");
    try {
      const res = await fetch("/api/payhero/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send the M-Pesa prompt");
      if (data.alreadyPaid) { setPhase("paid"); onPaid?.(); return; }
      setMaskedPhone(data.phone || "");
      setPhase("waiting");
      follow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the M-Pesa prompt");
      setPhase("failed");
    }
  }, [orderId, follow, onPaid]);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      pay();
    }
    return stopPolling;
  }, [autoStart, pay]);

  if (phase === "paid") {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
        <CheckCircle2 className="mx-auto mb-1 h-8 w-8" />
        Payment received - thank you! We are preparing your order.
      </div>
    );
  }

  if (phase === "sending" || phase === "waiting") {
    return (
      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
        <p className="font-bold">{phase === "sending" ? "Sending the M-Pesa prompt…" : "Check your phone"}</p>
        {phase === "waiting" && (
          <p className="mt-1">
            Enter your M-Pesa PIN on the prompt{maskedPhone ? ` sent to ${maskedPhone}` : ""} to pay. This page updates by itself.
          </p>
        )}
      </div>
    );
  }

  if (phase === "failed" || phase === "timeout") {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        <XCircle className="mx-auto mb-1 h-8 w-8" />
        <p className="font-semibold">
          {error || (phase === "timeout" ? "We have not received the payment yet." : "The payment did not go through.")}
        </p>
        <button onClick={pay} className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-glow">
          Send M-Pesa prompt again
        </button>
      </div>
    );
  }

  return (
    <button onClick={pay} className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
      <Smartphone className="h-4 w-4" /> Pay with M-Pesa
    </button>
  );
};
