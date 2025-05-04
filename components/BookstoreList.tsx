"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Bookstore } from "../types/supabase";
import { Pagination } from "./Pagination";
import { BookstoreCard } from "./BookstoreCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BookstoreListProps {
  searchQuery?: string;
}

const ITEMS_PER_PAGE = 40;

export function BookstoreList({ searchQuery = "" }: BookstoreListProps) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const [bookstores, setBookstores] = useState<Bookstore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [showSpecialEdition, setShowSpecialEdition] = useState(false);

  const [wantToGoIds, setWantToGoIds] = useState<Set<string>>(new Set());
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [markingBookstoreId, setMarkingBookstoreId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let bookstoreQuery = supabase
          .from("bookstores")
          .select("*, id")
          .order("number", { ascending: true });

        if (showClosed)
          bookstoreQuery = bookstoreQuery.not("close_info", "is", null);
        else bookstoreQuery = bookstoreQuery.is("close_info", null);

        if (showSpecialEdition)
          bookstoreQuery = bookstoreQuery.eq("special_edition", true);

        if (searchQuery) {
          bookstoreQuery = bookstoreQuery.or(
            `registered_name.ilike.%${searchQuery}%,prefecture.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`
          );
        }

        const { data: bookstoreData, error: bookstoreError } =
          await bookstoreQuery;
        if (bookstoreError) throw bookstoreError;
        setBookstores(bookstoreData || []);
        setCurrentPage(1);

        if (userId) {
          const [
            { data: wantData, error: wantError },
            { data: visitedData, error: visitedError },
          ] = await Promise.all([
            supabase
              .from("want_to_go_bookstores")
              .select("bookstore_id")
              .eq("user_id", userId),
            supabase
              .from("visited_bookstores")
              .select("bookstore_id")
              .eq("user_id", userId),
          ]);

          if (wantError) throw wantError;
          if (visitedError) throw visitedError;

          setWantToGoIds(
            new Set(wantData?.map((item) => item.bookstore_id) || [])
          );
          setVisitedIds(
            new Set(visitedData?.map((item) => item.bookstore_id) || [])
          );
        } else {
          setWantToGoIds(new Set());
          setVisitedIds(new Set());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error ? err.message : "データの取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchQuery, showClosed, showSpecialEdition, userId]);

  const handleMarkWantToGo = async (bookstoreId: string) => {
    if (!userId) {
      router.push("/api/auth/signin");
      return;
    }
    setMarkingBookstoreId(bookstoreId);
    try {
      const response = await fetch("/api/bookstores/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookstoreId, markType: "want_to_go" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as want to go");
      }

      setWantToGoIds((prev) => new Set(prev).add(bookstoreId));
      setVisitedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookstoreId);
        return newSet;
      });
    } catch (err) {
      console.error("Error marking want to go:", err);
      setError(err instanceof Error ? err.message : "マーク処理に失敗しました");
    } finally {
      setMarkingBookstoreId(null);
    }
  };

  const handleMarkVisited = async (bookstoreId: string) => {
    if (!userId) {
      router.push("/api/auth/signin");
      return;
    }
    setMarkingBookstoreId(bookstoreId);
    try {
      const response = await fetch("/api/bookstores/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookstoreId, markType: "visited" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as visited");
      }

      setVisitedIds((prev) => new Set(prev).add(bookstoreId));
      setWantToGoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookstoreId);
        return newSet;
      });
    } catch (err) {
      console.error("Error marking visited:", err);
      setError(err instanceof Error ? err.message : "マーク処理に失敗しました");
    } finally {
      setMarkingBookstoreId(null);
    }
  };

  if (status === "loading")
    return <div className="text-center">認証情報 読み込み中...</div>;
  if (loading) return <div className="text-center">読み込み中...</div>;
  if (error)
    return (
      <div className="text-center text-red-600">
        {error}{" "}
        <button
          onClick={() => setError(null)}
          className="ml-2 text-sm text-blue-600 underline"
        >
          閉じる
        </button>
      </div>
    );

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
              isWantToGo={wantToGoIds.has(bookstore.id)}
              isVisited={visitedIds.has(bookstore.id)}
              onMarkWantToGo={handleMarkWantToGo}
              onMarkVisited={handleMarkVisited}
              isMarking={markingBookstoreId === bookstore.id}
              isAuthenticated={!!userId}
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
