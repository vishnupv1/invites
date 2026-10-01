import { Link } from "react-router-dom";
import "./brand.css";

export function Brand({ light = false, linked = true }: { light?: boolean; linked?: boolean }) {
  const mark = (
    <>
      <img className="brand-mark" src="/brand/mark.png" alt="" />
      <img className="brand-name" src={light ? "/brand/wordmark-light.png" : "/brand/wordmark.png"} alt="" />
    </>
  );
  if (!linked) return <span className="site-brand">{mark}</span>;
  return (
    <Link className="site-brand" to="/" aria-label="InvitesReady">
      {mark}
    </Link>
  );
}
