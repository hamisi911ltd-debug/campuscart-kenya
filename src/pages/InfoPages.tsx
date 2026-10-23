import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP } from "@/components/SiteFooter";

const UPDATED = "23 October 2026";

const Article = ({ children, updated = true }: { children: ReactNode; updated?: boolean }) => (
  <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-card p-6 text-sm leading-relaxed shadow-card [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-extrabold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
    {updated && <p className="text-xs text-muted-foreground">Last updated: {UPDATED}</p>}
    {children}
  </article>
);

const WhatsAppLink = () => (
  <a href={`https://wa.me/${CONTACT_WHATSAPP}`} className="font-semibold text-accent underline">{CONTACT_PHONE_DISPLAY}</a>
);

export const AboutPage = () => (
  <PageShell title="About CampusMart Kenya">
    <Article updated={false}>
      <p>
        <strong>CampusMart Kenya</strong> is an online store built for Kenyan shoppers who want good products at fair prices,
        without the hassle of shopping around. From phones, earbuds and laptop accessories to kitchen appliances, fashion,
        beauty and gaming gear, we bring a wide, regularly refreshed range together in one easy-to-use shop.
      </p>
      <section>
        <h2>How it works</h2>
        <ul>
          <li><strong>Browse</strong> products with clear photos, prices and full specifications.</li>
          <li><strong>Order</strong> in a minute: enter your name, phone number and delivery location.</li>
          <li><strong>Pay securely</strong> with an M-Pesa prompt sent straight to your phone.</li>
          <li><strong>Track</strong> your order from confirmation to your door, and download your receipt as a PDF.</li>
        </ul>
      </section>
      <section>
        <h2>What we stand for</h2>
        <ul>
          <li><strong>Clear prices.</strong> The price you see is the price you pay, plus a flat KES 129 delivery fee.</li>
          <li><strong>Honest product information.</strong> We show specifications, options and what is in the box so you know what you are buying.</li>
          <li><strong>Real customer reviews.</strong> Only customers who have signed in can review a product. We do not publish made-up reviews.</li>
          <li><strong>Secure payments.</strong> Payments are handled by M-Pesa. We never see or store your M-Pesa PIN.</li>
        </ul>
      </section>
      <section>
        <h2>Where we deliver</h2>
        <p>We currently deliver within <strong>Nairobi and Mombasa</strong>. See <Link to="/shipping-returns" className="font-semibold text-accent underline">Delivery &amp; returns</Link> for details.</p>
      </section>
      <section>
        <h2>Get in touch</h2>
        <p>Questions about an order or a product? Message us on WhatsApp or call <WhatsAppLink />. More options are on our <Link to="/contact" className="font-semibold text-accent underline">contact page</Link>.</p>
      </section>
    </Article>
  </PageShell>
);

export const ContactPage = () => (
  <PageShell title="Contact us">
    <Article updated={false}>
      <p>We are happy to help with orders, delivery, payments or anything you would like to know about a product.</p>
      <section>
        <h2>WhatsApp and phone</h2>
        <p><WhatsAppLink /> - the fastest way to reach us. Please include your order number (it looks like CM12345678) if your question is about an order.</p>
      </section>
      <section>
        <h2>Delivery areas</h2>
        <p>Nairobi and Mombasa.</p>
      </section>
      <section>
        <h2>Track your order</h2>
        <p>Sign in and open <Link to="/orders" className="font-semibold text-accent underline">My Orders</Link> to see every update, including rider details when your order is on its way.</p>
      </section>
      <section>
        <h2>Before you ask</h2>
        <ul>
          <li>Delivery, fees and returns: <Link to="/shipping-returns" className="font-semibold text-accent underline">Delivery &amp; returns</Link></li>
          <li>How we handle your information: <Link to="/privacy" className="font-semibold text-accent underline">Privacy policy</Link></li>
        </ul>
      </section>
    </Article>
  </PageShell>
);

export const ShippingReturnsPage = () => (
  <PageShell title="Delivery & returns">
    <Article>
      <section>
        <h2>Where we deliver</h2>
        <p>We deliver to addresses within <strong>Nairobi and Mombasa</strong>. At checkout you pick your county and share your delivery location so the rider can find you.</p>
      </section>
      <section>
        <h2>Delivery fee</h2>
        <p>A flat <strong>KES 129</strong> per order, however many items you buy. It is added to your total at checkout.</p>
      </section>
      <section>
        <h2>How long it takes</h2>
        <p>After your M-Pesa payment is confirmed we prepare your order and update its status in <Link to="/orders" className="font-semibold text-accent underline">My Orders</Link>: processing, shipped, out for delivery and delivered. Delivery times can vary with the product and your location; we will keep you informed on the tracking page and, where needed, on WhatsApp.</p>
      </section>
      <section>
        <h2>Paying</h2>
        <p>Pay with M-Pesa. When you place an order, a payment prompt is sent to the phone number you entered. You can also pay with your CampusMart wallet balance if it covers the order.</p>
      </section>
      <section>
        <h2>Checking your order</h2>
        <p>Please check your items when they arrive. If something is missing, damaged or not what you ordered, contact us on <WhatsAppLink /> as soon as possible, ideally the same day, with your order number and a photo.</p>
      </section>
      <section>
        <h2>Returns and refunds</h2>
        <ul>
          <li>If an item arrives damaged, faulty or different from what you ordered, tell us within 48 hours of delivery and we will arrange a replacement or refund.</li>
          <li>Items should be unused and in their original packaging for a change-of-mind return, and are assessed case by case.</li>
          <li>Approved refunds are sent back to your M-Pesa number or wallet.</li>
          <li>If an item turns out to be out of stock after you order, we will tell you and refund you in full.</li>
        </ul>
      </section>
    </Article>
  </PageShell>
);

export const PrivacyPage = () => (
  <PageShell title="Privacy policy">
    <Article>
      <p>
        This policy explains what information <strong>CampusMart Kenya</strong> (campusmart.co.ke) collects, why, and the
        choices you have. We keep what we collect to what we need to run the shop and deliver your orders.
      </p>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address and, if you set one, a password (stored securely, never in plain text) or your Google account name and email if you sign in with Google.</li>
          <li><strong>Order details:</strong> the items you buy, the recipient name, phone number(s), delivery address and the location you share for delivery, and any note you leave for the rider.</li>
          <li><strong>Payment details:</strong> your M-Pesa phone number and the transaction confirmation. We never see your M-Pesa PIN or card details.</li>
          <li><strong>Reviews:</strong> the rating, comment and optional photo you choose to post, shown with your first name and last initial.</li>
          <li><strong>Technical information:</strong> your IP address and basic device information, used for security and to prevent abuse such as repeated sign-in attempts.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To process and deliver your orders, send payment prompts and keep you updated on your order.</li>
          <li>To provide receipts, order tracking and customer support.</li>
          <li>To keep the shop secure and prevent fraud and abuse.</li>
          <li>To show your review on the product you reviewed.</li>
        </ul>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <ul>
          <li><strong>Delivery:</strong> the rider and our team receive your name, phone number and delivery location so the order can reach you.</li>
          <li><strong>PayHero and Safaricom M-Pesa:</strong> process your payment.</li>
          <li><strong>WhatsApp:</strong> we may message you about your order, and our team receives order details by WhatsApp.</li>
          <li><strong>Cloudflare:</strong> hosts the website and its database.</li>
          <li><strong>Google:</strong> provides sign-in, maps for choosing your location and, through Google AdSense, the ads shown on the site.</li>
        </ul>
        <p className="mt-2">We do not sell your personal information.</p>
      </section>
      <section>
        <h2>Advertising</h2>
        <p>
          We show ads served by Google AdSense. Google and its partners may use cookies to serve and measure ads, and to
          personalise them based on your visits to this and other sites. You can manage or turn off personalised ads at{" "}
          <a href="https://www.google.com/settings/ads" className="font-semibold text-accent underline" rel="noopener noreferrer">google.com/settings/ads</a>. See our{" "}
          <Link to="/cookies" className="font-semibold text-accent underline">Cookie policy</Link> for more.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>We keep order records for as long as needed to provide support and meet our legal and accounting obligations. You can ask us to delete your account at any time.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Under the Kenya Data Protection Act, 2019 you may ask to see, correct or delete the personal information we hold
          about you, and object to how we use it. Contact us on <WhatsAppLink /> and we will respond promptly.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>We use encrypted connections, store passwords in hashed form, limit repeated sign-in attempts and restrict who in our team can see order details. No online service is perfectly secure, but we work to protect your information.</p>
      </section>
      <section>
        <h2>Children</h2>
        <p>CampusMart is not directed at children under 18, and we do not knowingly collect their information.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>If we change this policy we will update this page and its date.</p>
      </section>
    </Article>
  </PageShell>
);

export const TermsPage = () => (
  <PageShell title="Terms of service">
    <Article>
      <p>By using campusmart.co.ke you agree to these terms. Please read them with our <Link to="/privacy" className="font-semibold text-accent underline">Privacy policy</Link> and <Link to="/shipping-returns" className="font-semibold text-accent underline">Delivery &amp; returns</Link> page.</p>
      <section>
        <h2>Using the shop</h2>
        <ul>
          <li>You must be 18 or older, or have a parent or guardian's permission, to place an order.</li>
          <li>Give accurate details at checkout, including a working M-Pesa phone number and a delivery location in Nairobi or Mombasa.</li>
          <li>Do not misuse the site, attempt to disrupt it, or post reviews that are false, abusive or unlawful.</li>
        </ul>
      </section>
      <section>
        <h2>Products and prices</h2>
        <ul>
          <li>We work to keep product details, photos and prices accurate. Occasionally an error occurs; if so we will contact you before processing the order.</li>
          <li>Prices are in Kenyan shillings (KES). A flat KES 129 delivery fee applies to each order.</li>
          <li>Products are subject to availability. If an item is out of stock we will tell you and refund any payment in full.</li>
        </ul>
      </section>
      <section>
        <h2>Orders and payment</h2>
        <ul>
          <li>Placing an order sends an M-Pesa payment prompt to your phone. Your order is confirmed once payment is received.</li>
          <li>We may cancel an order we cannot fulfil, in which case you are refunded.</li>
        </ul>
      </section>
      <section>
        <h2>Delivery, returns and refunds</h2>
        <p>These are explained on the <Link to="/shipping-returns" className="font-semibold text-accent underline">Delivery &amp; returns</Link> page, which forms part of these terms.</p>
      </section>
      <section>
        <h2>Reviews</h2>
        <p>Reviews you post must be your honest experience. By posting a review or photo you allow CampusMart to display it on the product page. We may remove reviews that break these rules.</p>
      </section>
      <section>
        <h2>Our responsibility</h2>
        <p>We are not liable for delays or losses caused by events outside our control, or for indirect losses. Nothing in these terms limits your rights under Kenyan consumer protection law.</p>
      </section>
      <section>
        <h2>Changes and governing law</h2>
        <p>We may update these terms and will change the date above when we do. These terms are governed by the laws of Kenya.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions? Reach us on <WhatsAppLink />.</p>
      </section>
    </Article>
  </PageShell>
);
