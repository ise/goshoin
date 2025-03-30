"use client";

import { useState } from "react";
import { BookstoreList } from "@/components/BookstoreList";
import { UpdateLogs } from "@/components/UpdateLogs";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">御書印参加店舗検索</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          御書印プロジェクトに参加している書店を検索できます。
          店舗名、都道府県、住所で検索してください。
        </p>
      </div>
      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="店舗名、都道府県、住所で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <BookstoreList searchQuery={searchQuery} />

      <UpdateLogs />

      <footer className="mt-8 text-center text-sm text-gray-600">
        <p>
          最新の情報は、
          <a
            href="https://note.com/goshoin/n/ndd270b812fb5"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            御書印プロジェクト公式note
          </a>
          や各書店のHPなどでご確認ください。
        </p>
      </footer>
    </div>
  );
}
