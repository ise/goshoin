"use client";

import { Bookstore } from "../types/supabase";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface BookstoreCardProps {
  bookstore: Bookstore;
  isWant?: boolean;
  isVisited?: boolean;
}

export function BookstoreCard({
  bookstore,
  isWant,
  isVisited,
}: BookstoreCardProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const [isWantLoading, setIsWantLoading] = useState(false);
  const [isVisitedLoading, setIsVisitedLoading] = useState(false);
  const [isMarkedWant, setIsMarkedWant] = useState(!!isWant);
  const [isMarkedVisited, setIsMarkedVisited] = useState(!!isVisited);

  useEffect(() => {
    setIsMarkedWant(!!isWant);
    setIsMarkedVisited(!!isVisited);
  }, [isWant, isVisited]);

  // Google MapsのURLを生成（店舗名を含める）
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${bookstore.registered_name} ${bookstore.prefecture}${bookstore.city}${bookstore.address}`
  )}`;

  const handleMark = async (markType: "want_to_go" | "visited") => {
    if (!user) return;

    if (markType === "want_to_go") setIsWantLoading(true);
    if (markType === "visited") setIsVisitedLoading(true);

    try {
      const response = await fetch("/api/bookstores/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookstoreId: bookstore.id, markType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "マーク処理に失敗しました");
      }

      if (markType === "want_to_go") setIsMarkedWant((prev) => !prev);
      if (markType === "visited") setIsMarkedVisited((prev) => !prev);
    } catch (error) {
      console.error("Error marking bookstore:", error);
      alert(
        `エラー: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      if (markType === "want_to_go") setIsWantLoading(false);
      if (markType === "visited") setIsVisitedLoading(false);
    }
  };

  return (
    <div className="bg-secondary border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
          <div className="text-lg font-semibold text-primary">
            {bookstore.registered_name}
          </div>
          <span className="text-sm text-accent">
            登録番号: {bookstore.number}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium text-primary">時間帯:</span>{" "}
            {bookstore.opening_hour || "-"}
          </p>
          <p>
            <span className="font-medium text-primary">住所:</span>{" "}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-primary hover:underline"
            >
              {bookstore.prefecture}
              {bookstore.city}
              {bookstore.address}
            </a>
          </p>
          <p>
            <span className="font-medium text-primary">特装版取扱:</span>{" "}
            {bookstore.special_edition ? "あり" : "-"}
          </p>
          {bookstore.close_info && (
            <p className="text-red-600">
              <span className="font-medium text-primary">閉店情報:</span>{" "}
              {bookstore.close_info}
            </p>
          )}
        </div>
      </div>
      {user && (
        <div className="mt-4 pt-4 border-t border-primary/10 flex space-x-2">
          <button
            onClick={() => handleMark("want_to_go")}
            disabled={isWantLoading || isVisitedLoading}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1 ${
              isMarkedWant
                ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{isMarkedWant ? "行きたい！(済)" : "行きたい"}</span>
          </button>
          <button
            onClick={() => handleMark("visited")}
            disabled={isVisitedLoading || isWantLoading}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1 ${
              isMarkedVisited
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{isMarkedVisited ? "行った！(済)" : "行った"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
