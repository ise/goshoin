"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // リダイレクト用にインポート
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@customTypes/supabase"; // パスエイリアスを使ってインポートしてみる
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // shadcn/ui の Tabs を使う場合

// TODO: 行きたい/行った店舗の型定義 (bookstores テーブルの情報も含む)
type MarkedBookstore = {
  id: string; // want_to_go or visited の ID
  user_id: string;
  bookstore_id: string;
  memo?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  bookstores: {
    // JOIN した書店情報
    id: string;
    registered_name: string;
    prefecture: string;
    city: string;
    address: string;
    // 他に必要な書店情報があれば追加
  } | null; // JOIN 失敗も考慮
};

// MarkListItem の Props を拡張
interface MarkListItemProps {
  item: MarkedBookstore;
  listType: "want" | "visited"; // どのリストかを示す
  onActionComplete: () => void; // アクション完了時に呼ぶ関数
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wantList, setWantList] = useState<MarkedBookstore[]>([]);
  const [visitedList, setVisitedList] = useState<MarkedBookstore[]>([]);

  const user = session?.user;
  const userId = user?.id;
  const supabaseAccessToken = session?.supabaseAccessToken;

  // ---- fetchData を useEffect の外に移動し、useCallback でラップ ----
  const fetchData = useCallback(async () => {
    // 関数の中身はほぼ同じだが、依存する userId, supabaseAccessToken を直接使う
    if (!userId || !supabaseAccessToken) {
      // データ取得前にローディング完了にする条件を追加
      if (status === "authenticated") {
        setLoadingData(false);
      }
      return;
    }

    setLoadingData(true);
    setError(null);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${supabaseAccessToken}` },
        },
      });

      // 行きたいリスト取得
      const { data: wantData, error: wantError } = await supabase
        .from("want_to_go_bookstores")
        .select(
          `
          *,
          bookstores (
            id, registered_name, prefecture, city, address
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (wantError) throw wantError;
      setWantList(wantData || []);

      // 行ったリスト取得
      const { data: visitedData, error: visitedError } = await supabase
        .from("visited_bookstores")
        .select(
          `
          *,
          bookstores (
            id, registered_name, prefecture, city, address
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (visitedError) throw visitedError;
      setVisitedList(visitedData || []);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
      setWantList([]);
      setVisitedList([]);
    } finally {
      setLoadingData(false);
    }
    // fetchData が依存する値を追加
  }, [userId, supabaseAccessToken, status]);
  // ---- ここまで fetchData の移動と useCallback ----

  // 認証状態のチェックとリダイレクト
  useEffect(() => {
    if (status === "loading") return; // セッション情報を待つ
    if (status === "unauthenticated") {
      router.push("/"); // 未認証ならホームページへリダイレクト (ログインページがあればそっちへ)
    }
  }, [status, router]);

  // データの取得 (useEffect の中では fetchData を呼び出すだけにする)
  useEffect(() => {
    fetchData(); // fetchData を呼び出す
  }, [fetchData]); // 依存配列には fetchData を指定

  // ローディング表示
  if (
    status === "loading" ||
    (status === "authenticated" && loadingData && !userId)
  ) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  // 未認証時はリダイレクトされるはずだが、念のため何も表示しない
  if (status === "unauthenticated" || !user) {
    return null;
  }

  // ユーザー情報表示部分
  const UserInfo = () => (
    <div className="flex items-center space-x-4 p-4 bg-secondary rounded-lg shadow-sm mb-6">
      {user.image && (
        <Image
          src={user.image}
          alt="User Avatar"
          width={64}
          height={64}
          className="rounded-full"
        />
      )}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {user.name || user.email}
        </h1>
      </div>
    </div>
  );

  // リストアイテム表示部分 (仮)
  const MarkListItem = ({
    item,
    listType,
    onActionComplete,
  }: MarkListItemProps) => {
    const [isLoading, setIsLoading] = useState(false); // ボタン共通のローディング状態

    // Google Maps の URL を生成するロジックを追加
    const googleMapsUrl = item.bookstores
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${item.bookstores.registered_name} ${item.bookstores.prefecture}${item.bookstores.city}${item.bookstores.address}`
        )}`
      : "#"; // 書店情報がない場合はリンクしない

    // アクションハンドラー
    const handleAction = async (actionType: "delete" | "mark") => {
      // listType と actionType から API に送る markType を決定
      let apiMarkType: "want_to_go" | "visited";
      if (listType === "want") {
        apiMarkType = actionType === "delete" ? "want_to_go" : "visited"; // Wantリスト: delete=want解除, mark=visited登録
      } else {
        // listType === 'visited'
        apiMarkType = actionType === "delete" ? "visited" : "want_to_go"; // Visitedリスト: delete=visited解除, mark=want登録
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/bookstores/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // API に bookstoreId と決定した markType を送る
          body: JSON.stringify({
            bookstoreId: item.bookstore_id,
            markType: apiMarkType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "アクションの実行に失敗しました");
        }

        // 成功したら親に通知してデータ再取得を促す
        onActionComplete();
      } catch (error) {
        console.error("Error performing action:", error);
        alert(
          `エラー: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        // ローディング解除は再取得が終わってからの方が自然だが、
        // UX向上のため、APIコールが終わったら一旦解除する
        setIsLoading(false);
      }
    };

    return (
      <div className="border-b border-gray-200 py-3 flex justify-between items-start">
        {/* 書店情報表示部分 (左側) */}
        <div className="flex-grow mr-4">
          {item.bookstores ? (
            <div>
              <p className="font-semibold text-primary">
                {item.bookstores.registered_name}
              </p>
              {/* 住所部分をリンクに変更 */}
              <p className="text-sm text-gray-600">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-primary hover:underline"
                >
                  {item.bookstores.prefecture}
                  {item.bookstores.city}
                  {item.bookstores.address}
                </a>
              </p>
              {item.memo && (
                <p className="text-sm text-gray-500 mt-1">メモ: {item.memo}</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">書店情報の取得に失敗</p>
          )}
        </div>

        {/* アクションボタン部分 (右側) */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
          {listType === "want" && (
            <>
              <button
                onClick={() => handleAction("delete")}
                disabled={isLoading}
                className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                削除
              </button>
              <button
                onClick={() => handleAction("mark")}
                disabled={isLoading}
                className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                行った
              </button>
            </>
          )}
          {listType === "visited" && (
            <>
              <button
                onClick={() => handleAction("delete")}
                disabled={isLoading}
                className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                削除
              </button>
              <button
                onClick={() => handleAction("mark")}
                disabled={isLoading}
                className="px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-700 hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                行きたい
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <UserInfo />

      {/* TODO: ここに Tabs コンポーネントを入れる */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-primary">
          行きたい店舗 ({wantList.length})
        </h2>
        {loadingData && <p>リストを読み込み中...</p>}
        {error && <p className="text-red-600">エラー: {error}</p>}
        {!loadingData && !error && wantList.length === 0 && (
          <p className="text-gray-500">
            行きたい店舗はまだ登録されていません。
          </p>
        )}
        {!loadingData && !error && wantList.length > 0 && (
          <div>
            {wantList.map((item) => (
              <MarkListItem
                key={item.id}
                item={item}
                listType="want"
                onActionComplete={fetchData}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4 text-primary">
          行った店舗 ({visitedList.length})
        </h2>
        {loadingData && <p>リストを読み込み中...</p>}
        {error && <p className="text-red-600">エラー: {error}</p>}
        {!loadingData && !error && visitedList.length === 0 && (
          <p className="text-gray-500">行った店舗はまだ登録されていません。</p>
        )}
        {!loadingData && !error && visitedList.length > 0 && (
          <div>
            {visitedList.map((item) => (
              <MarkListItem
                key={item.id}
                item={item}
                listType="visited"
                onActionComplete={fetchData}
              />
            ))}
          </div>
        )}
      </div>
      {/* --- Tabs コンポーネントここまで --- */}
    </div>
  );
}
