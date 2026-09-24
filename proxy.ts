import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Barrière de première ligne, même principe qu'ads-dashboard : aucune page ne
 * se rend sans session valide. Seules la signature et l'expiration du jeton
 * sont vérifiées ici (pas de lecture en base) ; un compte désactivé entre
 * temps reste la responsabilité de `getSession()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authentifie = token ? readSessionToken(token) !== null : false;

  if (pathname === "/login") {
    if (authentifie) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!authentifie) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
