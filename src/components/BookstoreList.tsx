"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bookstore } from "@/types/supabase";
import { Pagination } from "./Pagination";

interface BookstoreListProps {
  searchQuery?: string;
}

const ITEMS_PER_PAGE = 40;

export function BookstoreList({ searchQuery = "" }: BookstoreListProps) {
  const [bookstores, setBookstores] = useState<Bookstore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchBookstores() {
      try {
        let query = supabase
          .from("bookstores")
          .select("*")
          .order("number", { ascending: true });

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
  }, [searchQuery]);

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
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                店名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                時間帯
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                住所
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                特装版取扱
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBookstores.map((bookstore) => (
              <tr key={bookstore.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bookstore.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bookstore.registered_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bookstore.opening_hour || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bookstore.prefecture} {bookstore.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bookstore.special_edition ? "あり" : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
