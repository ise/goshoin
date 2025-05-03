import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { updateBookstoresService } from "../../../../services/updateBookstores";

export async function POST() {
  // シークレットキーの検証
  const headersList = headers();
  const secretKey = (await headersList).get("x-secret-key");

  if (secretKey !== process.env.CRON_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // バッチ処理の実行
  const [success, updatedCount, errorCount] = await updateBookstoresService();
  const data = {
    success,
    updatedCount,
    errorCount,
  };

  return NextResponse.json(data);
}
