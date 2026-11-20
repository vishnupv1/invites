import "./instagram-link.css";

export function InstagramLink({ className = "" }: { className?: string }) {
  return (
    <a className={className ? `ir-ig ${className}` : "ir-ig"} href="https://www.instagram.com/invitesready/" target="_blank" rel="noopener noreferrer">
      Instagram · @invitesready
    </a>
  );
}
