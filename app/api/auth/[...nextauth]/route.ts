import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import type { AuthOptions } from "next-auth";
// import { createClient } from "@supabase/supabase-js"; // コメントアウト

// Supabase Admin Client の import は callbacks で使うのでまだコメントアウトのまま
// import { supabaseAdmin } from "@/lib/supabaseAdmin"; // パス注意！

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
// Supabase の URL と Service Role Key の環境変数も使う
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}
if (!GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}
if (!NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}
// 環境変数のチェックを追加
if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}
if (!SUPABASE_JWT_SECRET) {
  throw new Error("Missing SUPABASE_JWT_SECRET environment variable");
}

// NextAuth の設定オブジェクトを定義してエクスポートする
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: SupabaseAdapter({
    url: SUPABASE_URL,
    secret: SUPABASE_SERVICE_ROLE_KEY,
  }),
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      const signingSecret = SUPABASE_JWT_SECRET;
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret);
      }
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // pages: { ... } // 必要なら設定
};

// 定義した authOptions を使ってハンドラを作成
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
