import { Link } from "react-router-dom";
import "./breadcrumbs.css";

export type Crumb = { label: string; to?: string; onClick?: () => void };

export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  if (!items.length) return null;
  return (
    <nav className={`crumbs${className ? ` ${className}` : ""}`} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 ? <span className="crumbs-sep" aria-hidden="true">/</span> : null}
              {current ? (
                <span aria-current="page">{item.label}</span>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick}>{item.label}</button>
              ) : item.to ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
