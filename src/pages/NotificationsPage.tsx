import { PageShell } from "@/components/PageShell";
import { Bell } from "lucide-react";

const items = [
  { t: "Flash deal alert!", s: "MacBook Pro is 25% off — ends tonight 🔥", time: "2m" },
  { t: "Your order is on the way", s: "Boda rider Kevin is 5 min from your hostel.", time: "1h" },
  { t: "New message from seller", s: "About 'CLRS Algorithms 4th Ed'", time: "3h" },
  { t: "M-PESA payout received", s: "KES 1,800 for your calculator listing.", time: "Yesterday" },
];

const NotificationsPage = () => (
  <PageShell title="Notifications">
    <ul className="space-y-2">
      {items.map((n, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary"><Bell className="h-4 w-4" /></div>
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground">{n.t}</div>
            <div className="text-xs text-muted-foreground">{n.s}</div>
          </div>
          <span className="text-[10px] text-muted-foreground">{n.time}</span>
        </li>
      ))}
    </ul>
  </PageShell>
);

export default NotificationsPage;
