import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BackIcon } from "./marks";

type Crumb = { label: string; href?: string };

type Props = {
  items: Crumb[];
  onBack?: () => void;
  backHref?: string;
  aside?: ReactNode;
};

export function BreadcrumbBar({ items, onBack, backHref = "/", aside }: Props) {
  const back = backHref && !onBack ? (
    <Link className="ir-back" to={backHref} aria-label="Back">
      <BackIcon />
    </Link>
  ) : (
    <button className="ir-back" type="button" aria-label="Back" onClick={onBack}>
      <BackIcon />
    </button>
  );
  return (
    <div className="ir-crumbs">
      {back}
      <nav aria-label="Breadcrumb">
        <ol>
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`}>
                {index > 0 ? <span className="ir-crumbs-sep" aria-hidden="true">/</span> : null}
                {item.href && !last ? <Link to={item.href}>{item.label}</Link> : <span aria-current={last ? "page" : undefined}>{item.label}</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      {aside ? <div className="ir-crumbs-aside">{aside}</div> : null}
    </div>
  );
}
