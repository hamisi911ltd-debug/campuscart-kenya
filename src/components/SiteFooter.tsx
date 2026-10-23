import { Link } from "react-router-dom";

export const CONTACT_PHONE_DISPLAY = "0143 531 813";
export const CONTACT_WHATSAPP = "254143531813";

const links = [
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact us" },
  { to: "/shipping-returns", label: "Delivery & returns" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
  { to: "/cookies", label: "Cookie policy" },
];

/** Site-wide footer: who we are, how to reach us, and the policy pages. */
export const SiteFooter = () => (
  <footer className="mx-auto mt-10 max-w-7xl border-t border-border px-4 pb-6 pt-6 text-sm text-muted-foreground">
    <div className="grid gap-6 md:grid-cols-3">
      <div>
        <p className="text-base font-extrabold text-foreground">CampusMart Kenya</p>
        <p className="mt-2 leading-relaxed">
          An online store for everyday products at fair prices - phones and electronics, home and kitchen, fashion,
          beauty, gaming and more. We deliver within Nairobi and Mombasa and you pay securely with M-Pesa.
        </p>
      </div>
      <nav aria-label="Footer">
        <p className="font-bold text-foreground">Help &amp; information</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {links.map((l) => (
            <li key={l.to}><Link to={l.to} className="hover:text-foreground hover:underline">{l.label}</Link></li>
          ))}
        </ul>
      </nav>
      <div>
        <p className="font-bold text-foreground">Contact</p>
        <ul className="mt-2 space-y-1.5">
          <li>WhatsApp / phone: <a href={`https://wa.me/${CONTACT_WHATSAPP}`} className="font-semibold text-foreground hover:underline">{CONTACT_PHONE_DISPLAY}</a></li>
          <li>Delivery: Nairobi and Mombasa</li>
          <li>Payments: M-Pesa</li>
        </ul>
      </div>
    </div>
    <p className="mt-6 text-xs">&copy; {new Date().getFullYear()} CampusMart Kenya. All rights reserved.</p>
  </footer>
);
