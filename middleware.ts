import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log(`Middleware running for: ${request.nextUrl.pathname}`);
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookieValue = request.cookies.get(name)?.value;
          console.log(
            `Middleware cookies.get('${name}'): ${
              cookieValue ? "found" : "not found"
            }`
          );
          return cookieValue;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`Middleware cookies.set('${name}')`);
          // If the cookie is updated, update the request for the next middleware
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Update the response cookies for the browser
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log(`Middleware cookies.remove('${name}')`);
          // If the cookie is removed, update the request for the next middleware
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Update the response cookies for the browser
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  console.log("Middleware: Calling supabase.auth.getUser()");
  try {
    // The getUser call automatically triggers the set/remove cookie handlers if the session needs update/removal
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Middleware supabase.auth.getUser() Error:", error.message);
    } else {
      console.log(
        "Middleware supabase.auth.getUser() Success:",
        user?.id ? `User ID: ${user.id}` : "No user found"
      );
    }
  } catch (e: unknown) {
    // エラーが Error インスタンスかチェックしてメッセージを取り出す
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(
      "Middleware supabase.auth.getUser() Exception:",
      errorMessage
    );
  }

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
