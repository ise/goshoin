import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST() {
  // シークレットキーの検証
  const headersList = headers();
  const secretKey = (await headersList).get("x-secret-key");

  if (secretKey !== process.env.CRON_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // バッチ処理の実行
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/update-bookstores`,
    { method: "POST" }
  );
  const data = await response.json();

  return NextResponse.json(data);
}
