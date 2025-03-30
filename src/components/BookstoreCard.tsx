"use client";

import { Bookstore } from "@/types/supabase";

interface BookstoreCardProps {
  bookstore: Bookstore;
}

export function BookstoreCard({ bookstore }: BookstoreCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">
          {bookstore.registered_name}
        </h3>
        <span className="text-sm text-gray-500">
          登録番号: {bookstore.number}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">時間帯:</span>{" "}
          {bookstore.opening_hour || "-"}
        </p>
        <p>
          <span className="font-medium">住所:</span> {bookstore.prefecture}{" "}
          {bookstore.address}
        </p>
        <p>
          <span className="font-medium">特装版取扱:</span>{" "}
          {bookstore.special_edition ? "あり" : "-"}
        </p>
        {bookstore.close_info && (
          <p className="text-red-600">
            <span className="font-medium">閉店情報:</span>{" "}
            {bookstore.close_info}
          </p>
        )}
      </div>
    </div>
  );
}
