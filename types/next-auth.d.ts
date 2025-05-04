// import NextAuth, { DefaultSession, DefaultUser } from "next-auth"; // 不要
// import { JWT, DefaultJWT } from "next-auth/jwt"; // 不要
import { DefaultSession } from "next-auth"; // DefaultSession は使う
import { DefaultJWT } from "next-auth/jwt"; // DefaultJWT は使う

// Session オブジェクトの user に id を追加
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Supabase の user_id (UUID) を入れる想定
    } & DefaultSession["user"]; // 元々の name, email, image も含める
    supabaseAccessToken: string;
  }

  // User オブジェクトにも id を追加 (必要に応じて)
  // interface User extends DefaultUser {
  //   id: string;
  // }
}

// JWT オブジェクト (token) に sub (Supabaseのuser_id) を追加
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    sub: string; // ここに Supabase の user_id を入れている
  }
}
