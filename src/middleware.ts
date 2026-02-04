import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/forget-password",
  "/code-otp",
  "/change-password",
];

// Routes statiques à ignorer
const staticRoutes = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/images",
  "/assets",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les routes statiques
  if (staticRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get("auth_token")?.value;

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/", request.url);
    // Sauvegarder l'URL de redirection pour après la connexion
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si l'utilisateur est authentifié et essaie d'accéder à la page de login
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/trafic/trafic_dashboard", request.url));
  }

  return NextResponse.next();
}

// Configuration du matcher pour appliquer le middleware
export const config = {
  matcher: [
    /*
     * Appliquer le middleware à toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - images publiques
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
