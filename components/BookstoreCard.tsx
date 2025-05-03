"use client";

import { Bookstore } from "../types/supabase";

interface BookstoreCardProps {
  bookstore: Bookstore;
}

export function BookstoreCard({ bookstore }: BookstoreCardProps) {
  // Google MapsのURLを生成（店舗名を含める）
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${bookstore.registered_name} ${bookstore.prefecture}${bookstore.city}${bookstore.address}`
  )}`;

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
    </div>
  );
}
