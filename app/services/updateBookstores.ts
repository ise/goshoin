"use strict";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UpdateLog } from "../../types/supabase";
import { convertToFullWidthNumber } from "../../lib/utils";

const SPREADSHEET_ID = "1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI";
const PARTICIPANT_SHEET_ID = "1460657161";
const PARTICIPANT_SHEET_RANGE = "A:G";
const SPECIAL_EDITION_SHEET_ID = "1503676788";
const SPECIAL_EDITION_SHEET_RANGE = "C:E";

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

function normalizeAddress(address: string) {
  return convertToFullWidthNumber(address.replace(/−/, "－"));
}

function trimPrefectureSuffix(prefecture: string) {
  return prefecture.replace(/[都道府県]$/, "");
}

async function fetchSheetData(sheetId: string, range: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${sheetId}&range=${range}`;
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
  supabase: SupabaseClient,
  log: Omit<UpdateLog, "id" | "created_at">
) {
  const { error } = await supabase.from("update_logs").insert(log);

  if (error) {
    console.error("Error creating log:", error);
  }
}

function compareParticipantHeader(header: string[]) {
  const convertedHeader = header.map((h, i) => {
    if (i === 0) h = h.replace(/^御書印参加店リスト（.+） /, "");
    return h.trim();
  });
  const compareList = [
    [convertedHeader[0], "登録番号"],
    [convertedHeader[1], "都道府県など"],
    [convertedHeader[2], "市町村名"],
    [convertedHeader[3], "登録店名"],
    [convertedHeader[4], "時間帯"],
    [convertedHeader[5], "創業年"],
    [convertedHeader[6], "住所"],
  ];
  return [compareList.every(([a, b]) => a === b), compareList];
}

function compareSpecialEditionHeader(header: string[]) {
  const convertedHeader = header.map((h, i) => {
    if (i === 0) h = h.replace(/^特装版取扱店リスト（.+） /, "");
    return h.trim();
  });
  const compareList = [
    [convertedHeader[0], "書店名"],
    [convertedHeader[1], "都道府県"],
    [convertedHeader[2], "住所"],
  ];
  return [compareList.every(([a, b]) => a === b), compareList];
}

export async function updateBookstoresService() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 参加店リストの取得
    const participantRows = await fetchSheetData(
      PARTICIPANT_SHEET_ID,
      PARTICIPANT_SHEET_RANGE
    );
    // ヘッダをチェック
    const [isValidParticipant, compareListParticipant] =
      compareParticipantHeader(participantRows[0]);
    if (!isValidParticipant) {
      throw new Error("Invalid participant header: " + compareListParticipant);
    }
    const bookstores = participantRows.slice(1).map((row) => {
      const [
        number,
        prefecture,
        city,
        registered_name,
        opening_hour,
        establishment_year,
        address,
      ] = row;
      const closeInfoMatch = registered_name.match(/【(.+?)】/);
      const name = registered_name.replace(/【(.+?)】/, "");
      const close_info = closeInfoMatch ? closeInfoMatch[1] : null;
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
        address: normalizeAddress(address),
        special_edition: false,
        close_info,
      };
    });

    // 特装版取扱店リストの取得
    const specialEditionRows = await fetchSheetData(
      SPECIAL_EDITION_SHEET_ID,
      SPECIAL_EDITION_SHEET_RANGE
    );
    // ヘッダをチェック
    const [isValidSpecialEdition, compareListSpecialEdition] =
      compareSpecialEditionHeader(specialEditionRows[0]);
    if (!isValidSpecialEdition) {
      throw new Error(
        "Invalid special edition header: " + compareListSpecialEdition
      );
    }
    const specialEditionBookstores = specialEditionRows.slice(1).map((row) => ({
      name: row[0],
      prefecture: row[1],
      address: row[2],
    }));
    // データベースの更新
    let updatedCount = 0;
    let errorCount = 0;
    for (const bookstore of bookstores) {
      const isSpecialEdition = specialEditionBookstores.some(
        (special) =>
          special.name === bookstore.name &&
          trimPrefectureSuffix(special.prefecture) ===
            trimPrefectureSuffix(bookstore.prefecture)
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
          ? `${updatedCount} 件の店舗を更新しました`
          : `${updatedCount} 件の店舗を更新しました。${errorCount} 件の店舗の更新に失敗しました`,
      error_details:
        errorCount > 0 ? `${errorCount} 件の店舗の更新に失敗しました` : null,
    });

    return [true, updatedCount, errorCount];
  } catch (error) {
    console.error("Error in update-bookstores:", error);

    // エラーログの作成
    await createLog(supabase, {
      status: "error",
      message: "Failed to update bookstores",
      error_details:
        error instanceof Error ? error.message : "Unknown error occurred",
    });

    return [false, 0, 1];
  }
}
