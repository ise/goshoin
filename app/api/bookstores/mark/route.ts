import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function POST(request: Request) {
  console.log("API Route /api/bookstores/mark called");
  const session = await getServerSession(authOptions);
  console.log("API Route getServerSession:", session);

  if (!session?.user?.id) {
    console.log("API Route: No session found, returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const supabaseAccessToken = session?.supabaseAccessToken;
  console.log("API Route: User ID from session:", userId);
  if (!supabaseAccessToken) {
    console.error("API Route: supabaseAccessToken missing from session");
    return NextResponse.json(
      { error: "Internal Server Error: Missing access token" },
      { status: 500 }
    );
  }

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
        global: {
          headers: { Authorization: `Bearer ${supabaseAccessToken}` },
        },
      }
    );

    if (markType === "want_to_go") {
      const { data: existing, error: selectError } = await supabase
        .from("want_to_go_bookstores")
        .select("id")
        .eq("user_id", userId)
        .eq("bookstore_id", bookstoreId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error: deleteError } = await supabase
          .from("want_to_go_bookstores")
          .delete()
          .match({ user_id: userId, bookstore_id: bookstoreId });
        if (deleteError) throw deleteError;
        console.log(
          `want_to_go removed for user ${userId}, bookstore ${bookstoreId}`
        );

        const { error: deleteVisitedError } = await supabase
          .from("visited_bookstores")
          .delete()
          .match({ user_id: userId, bookstore_id: bookstoreId });
        if (deleteVisitedError)
          console.warn(
            "Failed to remove from visited after marking want_to_go:",
            deleteVisitedError
          );
      } else {
        const { error: insertError } = await supabase
          .from("want_to_go_bookstores")
          .insert({ user_id: userId, bookstore_id: bookstoreId });
        if (insertError) throw insertError;
        console.log(
          `want_to_go added for user ${userId}, bookstore ${bookstoreId}`
        );

        const { error: deleteVisitedError } = await supabase
          .from("visited_bookstores")
          .delete()
          .match({ user_id: userId, bookstore_id: bookstoreId });
        if (deleteVisitedError)
          console.warn(
            "Failed to remove from visited after marking want_to_go:",
            deleteVisitedError
          );
      }
    } else if (markType === "visited") {
      const { data: existing, error: selectError } = await supabase
        .from("visited_bookstores")
        .select("id")
        .eq("user_id", userId)
        .eq("bookstore_id", bookstoreId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error: deleteError } = await supabase
          .from("visited_bookstores")
          .delete()
          .match({ user_id: userId, bookstore_id: bookstoreId });
        if (deleteError) throw deleteError;
        console.log(
          `visited removed for user ${userId}, bookstore ${bookstoreId}`
        );
      } else {
        const { error: insertError } = await supabase
          .from("visited_bookstores")
          .insert({ user_id: userId, bookstore_id: bookstoreId });
        if (insertError) throw insertError;
        console.log(
          `visited added for user ${userId}, bookstore ${bookstoreId}`
        );

        const { error: deleteWantError } = await supabase
          .from("want_to_go_bookstores")
          .delete()
          .match({ user_id: userId, bookstore_id: bookstoreId });
        if (deleteWantError)
          console.warn(
            "Failed to remove from want_to_go after marking visited:",
            deleteWantError
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/bookstores/mark:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE ハンドラもここに追加予定
