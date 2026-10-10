import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  href: string;
  children: ReactNode;
  onDark?: boolean;
};

export function TextLink({ href, children, onDark = false }: Props) {
  const className = `ir-textlink${onDark ? " is-ondark" : ""}`;
  if (href.startsWith("/")) {
    return (
      <Link className={className} to={href}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}
