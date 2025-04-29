"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <span className="text-lg sm:text-xl font-bold">
                &quot;非公式&quot;御書印参加店舗検索
              </span>
            </Link>
          </div>
          {/* PC用ナビゲーション */}
          <nav className="hidden md:flex items-center">
            <Link
              href="/about"
              className={`text-sm font-medium ${
                pathname === "/about"
                  ? "text-secondary"
                  : "text-white/80 hover:text-white"
              }`}
            >
              このサイトについて
            </Link>
          </nav>
          {/* スマホ用ハンバーガーメニュー */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
              aria-label="メニュー"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* スマホ用メニュー */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/about"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/about"
                    ? "text-secondary bg-primary/10"
                    : "text-white/80 hover:text-white hover:bg-primary/10"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                このサイトについて
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
