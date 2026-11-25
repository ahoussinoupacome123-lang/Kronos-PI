import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protège l'espace connecté. La vérification complète de la session est refaite côté page (readSession).
const DEV_SECRET = "reclam-graph-dev-secret-a-remplacer-en-production-0001";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("rg_session")?.value;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET ?? DEV_SECRET));
      return NextResponse.next();
    } catch {
      /* session invalide ou expirée */
    }
  }
  const url = new URL("/connexion", request.url);
  url.searchParams.set("suite", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/tableau-de-bord/:path*"],
};
