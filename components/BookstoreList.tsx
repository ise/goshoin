"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { Bookstore } from "../types/supabase";
import { Pagination } from "./Pagination";
import { BookstoreCard } from "./BookstoreCard";
import { useSession } from "next-auth/react";

interface BookstoreWithMarks extends Bookstore {
  isWant?: boolean;
  isVisited?: boolean;
}

interface BookstoreListProps {
  searchQuery?: string;
}

const ITEMS_PER_PAGE = 40;

export function BookstoreList({ searchQuery = "" }: BookstoreListProps) {
  const [bookstores, setBookstores] = useState<BookstoreWithMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [showSpecialEdition, setShowSpecialEdition] = useState(false);

  const { data: session } = useSession();
  const userId = session?.user?.id;
  const supabaseAccessToken = session?.supabaseAccessToken;

  useEffect(() => {
    async function fetchBookstores() {
      setLoading(true);
      setError(null);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient<Database>(
          supabaseUrl,
          supabaseAnonKey,
          supabaseAccessToken
            ? {
                global: {
                  headers: { Authorization: `Bearer ${supabaseAccessToken}` },
                },
              }
            : {}
        );

        let query = supabase
          .from("bookstores")
          .select("*")
          .order("number", { ascending: true });

        if (showClosed) {
          query = query.not("close_info", "is", null);
        } else {
          query = query.is("close_info", null);
        }

        if (showSpecialEdition) {
          query = query.eq("special_edition", true);
        }

        if (searchQuery) {
          query = query.or(
            `name.ilike.%${searchQuery}%,prefecture.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`
          );
        }

        const { data: bookstoreData, error: bookstoreError } = await query;

        if (bookstoreError) throw bookstoreError;

        if (!bookstoreData) {
          setBookstores([]);
          return;
        }

        let finalBookstores: BookstoreWithMarks[] = bookstoreData;

        if (userId && bookstoreData.length > 0) {
          const bookstoreIds = bookstoreData.map((b) => b.id);

          const { data: marksData, error: rpcError } = await supabase.rpc(
            "get_bookstore_marks",
            { p_bookstore_ids: bookstoreIds }
          );

          if (rpcError) {
            console.error("Error fetching bookstore marks via RPC:", rpcError);
            setError(`マーク情報の取得に失敗しました: ${rpcError.message}`);
          }

          const marksMap = new Map<
            string,
            { is_want: boolean; is_visited: boolean }
          >();
          if (marksData) {
            for (const mark of marksData) {
              marksMap.set((mark as any).bookstore_id, {
                is_want: (mark as any).is_want,
                is_visited: (mark as any).is_visited,
              });
            }
          }

          finalBookstores = bookstoreData.map((bookstore) => {
            const marks = marksMap.get(bookstore.id);
            return {
              ...bookstore,
              isWant: marks?.is_want || false,
              isVisited: marks?.is_visited || false,
            };
          });
        }

        setBookstores(finalBookstores);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching bookstores:", err);
        setError(
          err instanceof Error ? err.message : "データの取得に失敗しました"
        );
        setBookstores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBookstores();
  }, [
    searchQuery,
    showClosed,
    showSpecialEdition,
    userId,
    supabaseAccessToken,
  ]);

  if (loading) return <div className="text-center">読み込み中...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  const totalPages = Math.ceil(bookstores.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookstores = bookstores.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showSpecialEdition}
            onChange={(e) => setShowSpecialEdition(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>特装版取扱店舗</span>
        </label>
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>閉店済み店舗</span>
        </label>
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4">
          {currentBookstores.map((bookstore) => (
            <BookstoreCard
              key={bookstore.id}
              bookstore={bookstore}
              isWant={bookstore.isWant}
              isVisited={bookstore.isVisited}
            />
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
