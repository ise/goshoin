"use client"; // クライアントコンポーネントとしてマーク

import { SessionProvider } from "next-auth/react";
import React from "react";

// SessionProvider をラップするクライアントコンポーネント
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
