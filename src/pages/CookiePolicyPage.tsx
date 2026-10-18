import { PageShell } from "@/components/PageShell";
import { Link } from "react-router-dom";

const Row = ({ name, purpose, lasts }: { name: string; purpose: string; lasts: string }) => (
  <tr className="border-t border-border align-top">
    <td className="py-2 pr-3 font-mono text-xs">{name}</td>
    <td className="py-2 pr-3">{purpose}</td>
    <td className="py-2 whitespace-nowrap">{lasts}</td>
  </tr>
);

const CookiePolicyPage = () => (
  <PageShell title="Cookie Policy">
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-card p-6 text-sm leading-relaxed shadow-card">
      <p className="text-xs text-muted-foreground">Last updated: 18 October 2026</p>
      <p>
        This policy explains how <strong>CampusMart Kenya</strong> (campusmart.co.ke) uses cookies and similar browser
        storage. We keep it to what the shop needs to work. <strong>We do not use advertising or tracking cookies, and we
        do not sell your data.</strong>
      </p>

      <section>
        <h2 className="mb-2 text-base font-extrabold">What we store on your device</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-3">Item</th>
                <th className="pb-2 pr-3">What it does</th>
                <th className="pb-2">Lasts</th>
              </tr>
            </thead>
            <tbody>
              <Row name="Cart and favourites (browser storage)" purpose="Remembers the items in your cart and your favourites so they are still there when you come back." lasts="Until you clear them" />
              <Row name="Sign-in details (browser storage)" purpose="Keeps you signed in and holds your wallet balance and profile for the shop pages." lasts="Until you sign out" />
              <Row name="Delivery details (browser storage)" purpose="Saves your name, phone number and delivery address on this device so checkout is faster next time. It is never shared with other visitors." lasts="Until you clear it" />
              <Row name="Settings (dark mode, language, notifications)" purpose="Remembers the preferences you choose on the Settings page." lasts="Until you clear them" />
              <Row name="Cookie notice choice" purpose="Remembers that you have seen the cookie notice so we do not show it again." lasts="Until you clear it" />
              <Row name="Site cache (service worker)" purpose="Stores the shop pages and images on your phone so CampusMart opens faster and works on a weak connection." lasts="Until updated" />
              <Row name="admin_session (cookie)" purpose="Only for CampusMart staff. A secure, HTTP-only cookie that keeps the admin signed in. Customers never receive it." lasts="12 hours" />
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-extrabold">Third-party services</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Google Sign-In</strong>: if you choose to sign in with Google, Google may set its own cookies under the Google privacy policy.</li>
          <li><strong>Google Maps</strong>: used when you pick your delivery location. Google may set cookies when the map loads.</li>
          <li><strong>PayHero / M-Pesa</strong>: payments are made through an M-Pesa prompt on your phone. We never see your M-Pesa PIN.</li>
          <li><strong>WhatsApp</strong>: when you share a product or send order details, WhatsApp opens in its own app or tab under its own terms.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-extrabold">Why we use them</h2>
        <p>
          Every item above is strictly necessary to run the shop (cart, sign-in, checkout, security, speed) or to remember a
          choice you made. Because we do not run analytics or advertising, there is nothing optional to switch on or off.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-extrabold">Your choices</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Clear cookies and site data in your browser settings at any time. You will be signed out and your cart will be emptied.</li>
          <li>Block cookies in your browser. The shop will still browse, but sign-in and checkout will not work.</li>
          <li>Control notifications and appearance from <Link to="/settings" className="font-semibold text-accent underline">Settings</Link>.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-extrabold">Contact us</h2>
        <p>
          Questions about this policy? Message us on WhatsApp at +254 108 254 465. If we ever add analytics or advertising,
          we will update this page and ask for your permission first.
        </p>
      </section>
    </article>
  </PageShell>
);

export default CookiePolicyPage;
