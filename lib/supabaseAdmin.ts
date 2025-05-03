import { createClient } from "@supabase/supabase-js";

// サーバーサイドでのみ使用する Supabase Admin Client
// 重要: このクライアントは管理者権限を持つため、ブラウザ側に公開しないこと！
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase URL or Service Role Key is missing in environment variables."
      );
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        // ブラウザの localStorage を使わないように設定
        persistSession: false,
        // ユーザーセッションの自動更新を無効化
        autoRefreshToken: false,
        // ユーザーセッションの検出を無効化
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseAdmin;
}
