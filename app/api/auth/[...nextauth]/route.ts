import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { AuthError } from "@supabase/supabase-js";

// NextAuthの設定オブジェクト
export const authOptions: NextAuthOptions = {
  // 認証プロバイダーのリスト
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!, // 環境変数から取得
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // 環境変数から取得
    }),
    // 他のプロバイダー（GitHubとか）もここに追加できるよ！
  ],
  // セッションの暗号化などに使う秘密鍵
  secret: process.env.NEXTAUTH_SECRET!,
  // 必要に応じて他の設定（コールバック、アダプターなど）もここに追加

  callbacks: {
    async jwt({ token, user, account /*, profile */ }) {
      if (user && account && account.provider === "google") {
        const supabase = getSupabaseAdmin();
        const email = user.email;
        const name = user.name;
        const avatarUrl = user.image;

        if (!email) {
          console.error("Google login response missing email.");
          throw new Error("Email not provided by Google.");
        }

        try {
          let supabaseUserId: string | undefined = undefined;
          let userAlreadyExists = false;

          // 1. Supabase Auth ユーザーを作成してみる
          console.log(
            `Attempting to create Supabase Auth user for ${email}...`
          );
          const randomPassword = crypto.randomBytes(16).toString("hex");
          const { data: createUserData, error: createUserError } =
            await supabase.auth.admin.createUser({
              email: email,
              password: randomPassword,
              email_confirm: true,
              user_metadata: { name: name, avatar_url: avatarUrl },
            });

          if (createUserError) {
            // AuthError 型かどうかをチェック
            if (createUserError instanceof AuthError) {
              // AuthError なら status プロパティが存在するはず
              if (
                createUserError.message.includes("User already registered") ||
                createUserError.status === 422 ||
                createUserError.message.includes("already exists")
              ) {
                console.log(`User ${email} already exists in Supabase Auth.`);
                userAlreadyExists = true;
                // 既存ユーザーのIDを取得するために listUsers を使う（エラー時のみ）
                // TODO: listUsersでの email フィルタリングが不可な場合の代替策検討
                const {
                  data: { users },
                  error: listError,
                } = await supabase.auth.admin.listUsers(); // emailフィルターを一旦外す
                const existingUser = users.find((u) => u.email === email);

                if (listError || !existingUser) {
                  console.error(
                    "Failed to retrieve existing user ID after duplicate error:",
                    listError
                  );
                  throw new Error(
                    "Failed to link account: could not retrieve existing user ID."
                  );
                }
                supabaseUserId = existingUser.id;
                console.log(
                  `Found existing Supabase Auth user ID: ${supabaseUserId}`
                );
              } else {
                // その他の AuthError
                console.error(
                  "Error creating Supabase Auth user (AuthError):",
                  createUserError.message,
                  createUserError.status
                );
                throw createUserError;
              }
            } else {
              // AuthError 以外のエラー (ネットワークエラーなど)
              console.error(
                "Error creating Supabase Auth user (Unknown):",
                createUserError
              );
              throw createUserError;
            }
          } else {
            // 作成成功
            supabaseUserId = createUserData.user.id;
            console.log(
              `Supabase Auth user created with ID: ${supabaseUserId}`
            );
          }

          // supabaseUserId が確定していれば profiles を upsert
          if (supabaseUserId) {
            const { error: upsertError } = await getSupabaseAdmin()
              .from("profiles")
              .upsert(
                {
                  id: supabaseUserId, // Supabase の user ID
                  name: name,
                  avatar_url: avatarUrl,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: "id",
                  ignoreDuplicates: false, // これがないと onConflict が効かない
                }
              );

            if (upsertError) {
              console.error("Supabase Profile Upsert Error:", upsertError);
            } else {
              console.log(`Profile upserted for user ID: ${supabaseUserId}`);
            }

            // JWT に ID をセット
            token.sub = supabaseUserId;
            token.name = name;
            token.picture = avatarUrl;
          } else if (!userAlreadyExists) {
            // ユーザー作成も失敗し、既存も見つけられなかった場合
            console.error("Failed to obtain Supabase User ID.");
            throw new Error(
              "Failed to link account: could not obtain user ID."
            );
          }
        } catch (error) {
          console.error(
            "Error during JWT callback Supabase operations:",
            error
          );
          throw new Error("Failed to link account with Supabase.");
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && token.picture && !session.user.image) {
        session.user.image = token.picture;
      }
      if (session.user && token.name && !session.user.name) {
        session.user.name = token.name;
      }
      if (session.user && token.email && !session.user.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
};

// APIルートのハンドラーを作成
const handler = NextAuth(authOptions);

// GETリクエストとPOSTリクエストの両方を処理できるようにエクスポート
export { handler as GET, handler as POST };
