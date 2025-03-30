"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <span className="text-xl font-bold">
                &quot;非公式&quot;御書印参加店舗検索
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className={`text-sm font-medium ${
                isHome ? "text-secondary" : "text-white/80 hover:text-white"
              }`}
            >
              ホーム
            </Link>
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
        </div>
      </div>
    </header>
  );
}
