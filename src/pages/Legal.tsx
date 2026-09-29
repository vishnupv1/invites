import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./legal.css";

export const CONTACT_EMAIL = "hello@invitesready.com";

function Frame({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <div className="legal">
      <header className="legal-bar">
        <Link to="/">InvitesReady</Link>
        <nav aria-label="Policies">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>
      <main>
        <h1>{title}</h1>
        <p className="legal-lede">{lede}</p>
        {children}
      </main>
      <footer>
        <nav aria-label="Footer">
          <Link to="/templates">Templates</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>
    </div>
  );
}

export function Privacy() {
  return (
    <Frame title="Privacy policy" lede="Last updated 29 September 2026. This page explains what InvitesReady collects when you design, buy, or reply to an invitation.">
      <h2>Who we are</h2>
      <p>
        InvitesReady (invitesready.com) lets you design a digital invitation, share one link, and collect replies. Questions about this policy can go to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details you give us: your name, email address, and a password. We store the password only as a hash.</li>
        <li>Invitation content you type or upload: names, dates, venues, photos, music, and messages.</li>
        <li>Guest replies: the name and response someone submits on an invitation page.</li>
        <li>Purchase records: the template, the price, a coupon code if you used one, and the Razorpay order and payment identifiers. Card, UPI, and bank details are entered on Razorpay’s page, not on ours.</li>
        <li>Drafts saved in this browser before you publish.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use this information to create your account, show your invitation, store replies, confirm a purchase, and answer support email. We do not sell personal information.</p>
      <h2>Analytics</h2>
      <p>
        We use Google Analytics to see which pages are visited. Google may set cookies and receive your IP address and the page address. You can block analytics cookies in your browser. We use these visits to understand the site and to measure advertising.
      </p>
      <h2>How long we keep it</h2>
      <p>We keep your account, invitations, replies, and purchase records while the account is in use. Email {CONTACT_EMAIL} if you want an invitation or account removed.</p>
      <h2>Who else sees it</h2>
      <p>People with the invitation link can see the invitation and, if you turn replies on, can submit a reply. Razorpay processes the payment. Google processes analytics. We host the site and its database so the product can run.</p>
    </Frame>
  );
}

export function Terms() {
  return (
    <Frame title="Terms of use" lede="Last updated 29 September 2026. By creating an account or buying a template, you agree to these terms.">
      <h2>The product</h2>
      <p>InvitesReady provides invitation templates and a page your guests can open. You may design a draft without an account. Publishing a paid template requires a one-time purchase, unless a valid coupon applies or the template is free.</p>
      <h2>Your content</h2>
      <p>You keep the names, photos, music, and wording you add. You confirm you have the right to use them. You give InvitesReady permission to store and display that content so the invitation works. You may not resell a template or present our designs as your own product.</p>
      <h2>Accounts</h2>
      <p>Keep your login to yourself. You are responsible for invitations published from your account and for the replies those pages collect.</p>
      <h2>Payments</h2>
      <p>
        Prices are shown in Indian rupees before you pay. Razorpay collects the payment. A coupon that we accept reduces the price to zero for that template. Buying a template once lets you publish invitations with that design without paying again. See the <Link to="/refunds">refund policy</Link> for cancellations.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not use InvitesReady for unlawful, misleading, or abusive invitations, or to collect guest information you are not entitled to collect.</p>
    </Frame>
  );
}

export function Refunds() {
  return (
    <Frame title="Refunds" lede="Last updated 29 September 2026. Template purchases are one-time payments for a digital design.">
      <h2>What you are buying</h2>
      <p>A paid template is a digital licence to use that design on InvitesReady. The price on the checkout screen is the full price. A valid coupon can make that price zero. Free templates are not charged.</p>
      <h2>When we refund</h2>
      <p>Email {CONTACT_EMAIL} within 7 days of payment if you have not published an invitation with that template and you cannot use the design. We will refund the amount Razorpay charged for that order.</p>
      <h2>When we do not refund</h2>
      <ul>
        <li>The template was free, or a coupon already reduced the price to zero.</li>
        <li>You have published an invitation with that template.</li>
        <li>You changed your mind after the design was available in your account and the 7 days have passed.</li>
      </ul>
      <p>If a payment is taken and the template does not unlock, email us and we will either unlock it or refund the charge.</p>
    </Frame>
  );
}

export function Contact() {
  return (
    <Frame title="Contact" lede="InvitesReady makes digital invitations for weddings and other celebrations.">
      <h2>Email</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>Write to us about an account, a payment, a refund, or an invitation that will not open. Include the email on the account and, for a payment, the date you paid.</p>
      <h2>Policies</h2>
      <p>
        <Link to="/privacy">Privacy policy</Link>
        {" · "}
        <Link to="/terms">Terms of use</Link>
        {" · "}
        <Link to="/refunds">Refunds</Link>
      </p>
    </Frame>
  );
}
