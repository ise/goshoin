import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log(`Middleware running for: ${request.nextUrl.pathname}`);
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // localhost を 127.0.0.1 にリダイレクトする処理とか、
  // 他に必要な処理があればここに追加・残す

  console.log(`Middleware finished for: ${request.nextUrl.pathname}`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
