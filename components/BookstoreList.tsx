"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Bookstore } from "../types/supabase";
import { Pagination } from "./Pagination";
import { BookstoreCard } from "./BookstoreCard";

interface BookstoreListProps {
  searchQuery?: string;
}

const ITEMS_PER_PAGE = 40;

export function BookstoreList({ searchQuery = "" }: BookstoreListProps) {
  const [bookstores, setBookstores] = useState<Bookstore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [showSpecialEdition, setShowSpecialEdition] = useState(false);

  useEffect(() => {
    async function fetchBookstores() {
      try {
        let query = supabase
          .from("bookstores")
          .select("*")
          .order("number", { ascending: true });

        // 閉店情報のフィルタリング
        if (showClosed) {
          query = query.not("close_info", "is", null);
        } else {
          query = query.is("close_info", null);
        }

        // 特装版取扱のフィルタリング
        if (showSpecialEdition) {
          query = query.eq("special_edition", true);
        }

        // 検索クエリのフィルタリング
        if (searchQuery) {
          query = query.or(
            `name.ilike.%${searchQuery}%,prefecture.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;

        setBookstores(data || []);
        setCurrentPage(1); // 検索クエリが変更されたら1ページ目に戻る
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "データの取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBookstores();
  }, [searchQuery, showClosed, showSpecialEdition]);

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
            <BookstoreCard key={bookstore.id} bookstore={bookstore} />
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
