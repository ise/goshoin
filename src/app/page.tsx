"use client";

import { useState } from "react";
import { BookstoreList } from "@/components/BookstoreList";
import { SearchBox } from "@/components/SearchBox";
import { UpdateLogs } from "@/components/UpdateLogs";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">
          &quot;非公式&quot;御書印参加店舗検索奴
        </h1>
      </header>

      <SearchBox onSearch={setSearchQuery} />

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
    </main>
  );
}
