import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  console.log("API Route /api/bookstores/mark called");
  const session = await getServerSession(authOptions);
  console.log("API Route getServerSession:", session);

  if (!session?.user?.id) {
    console.log("API Route: No session found, returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  console.log("API Route: User ID from session:", userId);

  try {
    const {
      bookstoreId,
      markType,
    }: { bookstoreId: string; markType: "want_to_go" | "visited" } =
      await request.json();

    if (
      !bookstoreId ||
      !markType ||
      (markType !== "want_to_go" && markType !== "visited")
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch {}
          },
        },
      }
    );

    try {
      const {
        data: { user: supabaseUser },
        error: getUserError,
      } = await supabase.auth.getUser();
      console.log(
        "API Route supabase.auth.getUser (using headers cookies):",
        supabaseUser?.id ? `User ID: ${supabaseUser.id}` : "No user found",
        "Error:",
        getUserError
      );
      if (getUserError || !supabaseUser) {
        throw new Error(
          `Failed to get user from Supabase in API route: ${
            getUserError?.message || "No user object"
          }`
        );
      }
    } catch (e) {
      console.error("Error in API route getUser (using headers cookies):", e);
      throw e;
    }

    if (markType === "want_to_go") {
      const { error: upsertError } = await supabase
        .from("want_to_go_bookstores")
        .upsert(
          { user_id: userId, bookstore_id: bookstoreId },
          { onConflict: "user_id, bookstore_id" }
        );

      if (upsertError) throw upsertError;
    } else if (markType === "visited") {
      const { error: transactionError } = await supabase.rpc(
        "mark_bookstore_as_visited",
        {
          p_user_id: userId,
          p_bookstore_id: bookstoreId,
        }
      );

      if (transactionError) throw transactionError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking bookstore:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Failed in API route: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE ハンドラもここに追加予定
