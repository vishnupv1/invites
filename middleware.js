import { next } from "@vercel/functions";

export const config = {
  matcher: "/template/:path*",
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/template/") || !url.searchParams.has("event")) return next();
  url.searchParams.delete("event");
  return Response.redirect(url, 301);
}
