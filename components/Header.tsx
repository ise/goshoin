"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

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
          <nav className="hidden md:flex items-center space-x-4">
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

            {/* === 認証状態による表示切り替え (PC) === */}
            {status === "loading" && (
              <span className="text-sm text-white/80">Loading...</span>
            )}
            {status === "unauthenticated" && (
              <button
                onClick={() => signIn("google")}
                className="bg-accent hover:bg-accent/90 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                Googleでログイン
              </button>
            )}
            {status === "authenticated" && (
              <div className="flex items-center space-x-4">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={
                      session.user.name || session.user.email || "User Avatar"
                    }
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
            {/* === ここまで === */}
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

              {/* === 認証状態による表示切り替え (スマホ) === */}
              {status === "loading" && (
                <span className="block px-3 py-2 rounded-md text-base font-medium text-white/80">
                  Loading...
                </span>
              )}
              {status === "unauthenticated" && (
                <button
                  onClick={() => {
                    signIn("google");
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-primary/10"
                >
                  Googleでログイン
                </button>
              )}
              {status === "authenticated" && (
                <div className="px-3 py-2 space-y-2 border-t border-white/10 mt-2 pt-2">
                  <div className="flex items-center space-x-3">
                    {session?.user?.image && (
                      <img
                        src={session.user.image}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="block text-base font-medium text-white/80">
                      {session?.user?.name || session?.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-primary/10"
                  >
                    ログアウト
                  </button>
                </div>
              )}
              {/* === ここまで === */}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
