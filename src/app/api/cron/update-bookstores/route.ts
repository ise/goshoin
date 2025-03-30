import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { UpdateLog } from "@/types/supabase";
import { headers } from "next/headers";

const SPREADSHEET_ID = "1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI";
const PARTICIPANT_SHEET_ID = "1460657161";
const SPECIAL_EDITION_SHEET_ID = "1503676788";

// 都道府県コードのマッピング
const PREFECTURE_CODES: { [key: string]: number } = {
  北海道: 1,
  青森県: 2,
  岩手県: 3,
  宮城県: 4,
  秋田県: 5,
  山形県: 6,
  福島県: 7,
  茨城県: 8,
  栃木県: 9,
  群馬県: 10,
  埼玉県: 11,
  千葉県: 12,
  東京都: 13,
  神奈川県: 14,
  新潟県: 15,
  富山県: 16,
  石川県: 17,
  福井県: 18,
  山梨県: 19,
  長野県: 20,
  岐阜県: 21,
  静岡県: 22,
  愛知県: 23,
  三重県: 24,
  滋賀県: 25,
  京都府: 26,
  大阪府: 27,
  兵庫県: 28,
  奈良県: 29,
  和歌山県: 30,
  鳥取県: 31,
  島根県: 32,
  岡山県: 33,
  広島県: 34,
  山口県: 35,
  徳島県: 36,
  香川県: 37,
  愛媛県: 38,
  高知県: 39,
  福岡県: 40,
  佐賀県: 41,
  長崎県: 42,
  熊本県: 43,
  大分県: 44,
  宮崎県: 45,
  鹿児島県: 46,
  沖縄県: 47,
};

async function fetchSheetData(sheetId: string, range: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetId}&range=${range}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
  }
  const csv = await response.text();
  return csv
    .split("\n")
    .map((row) => row.split(",").map((cell) => cell.replace(/^"|"$/g, "")));
}

async function createLog(
  supabase: any,
  log: Omit<UpdateLog, "id" | "created_at">
) {
  const { error } = await supabase.from("update_logs").insert(log);

  if (error) {
    console.error("Error creating log:", error);
  }
}

export async function POST() {
  // ローカル環境の場合は検証をスキップ
  if (process.env.NODE_ENV !== "production") {
    console.log("Skipping trigger.dev verification in development mode");
  } else {
    // trigger.devからのリクエストかどうかを検証
    const headersList = await headers();
    const triggerId = headersList.get("x-trigger-id");
    const triggerSignature = headersList.get("x-trigger-signature");

    if (!triggerId || !triggerSignature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 参加店リストの取得
    const participantRows = await fetchSheetData(PARTICIPANT_SHEET_ID, "A:H");
    const bookstores = participantRows.slice(2).map((row, index) => {
      const [
        number,
        prefecture,
        city,
        registered_name,
        opening_hour,
        establishment_year,
        address,
      ] = row;
      const name = registered_name.replace(/【(.+?)】/, "");
      const prefecture_number = PREFECTURE_CODES[prefecture] || 0;

      return {
        number: parseInt(number),
        prefecture,
        prefecture_number,
        city,
        registered_name,
        name,
        opening_hour,
        establishment_year,
        address,
        special_edition: false,
      };
    });

    // 特装版取扱店リストの取得
    const specialEditionRows = await fetchSheetData(
      SPECIAL_EDITION_SHEET_ID,
      "A:C"
    );
    const specialEditionBookstores = specialEditionRows.slice(1).map((row) => ({
      name: row[0],
      prefecture: row[1],
      address: row[2],
    }));
    console.log(specialEditionBookstores);

    // データベースの更新
    let updatedCount = 0;
    let errorCount = 0;
    for (const bookstore of bookstores) {
      const isSpecialEdition = specialEditionBookstores.some(
        (special) =>
          special.name === bookstore.name &&
          special.prefecture === bookstore.prefecture &&
          special.address === bookstore.address
      );

      const { error } = await supabase.from("bookstores").upsert(
        {
          ...bookstore,
          special_edition: isSpecialEdition,
        },
        {
          onConflict: "number",
        }
      );

      if (error) {
        console.error(`Error updating bookstore ${bookstore.number}:`, error);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    // 更新ログの作成
    await createLog(supabase, {
      status: errorCount === 0 ? "success" : "error",
      message:
        errorCount === 0
          ? `Successfully updated ${updatedCount} bookstores`
          : `Updated ${updatedCount} bookstores with ${errorCount} errors`,
      error_details:
        errorCount > 0 ? `${errorCount} bookstores failed to update` : null,
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      errorCount,
    });
  } catch (error) {
    console.error("Error in update-bookstores:", error);

    // エラーログの作成
    await createLog(supabase, {
      status: "error",
      message: "Failed to update bookstores",
      error_details:
        error instanceof Error ? error.message : "Unknown error occurred",
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
