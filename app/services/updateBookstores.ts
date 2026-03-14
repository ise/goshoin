"use strict";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UpdateLog, Bookstore, Database } from "../../types/supabase";
import { convertToFullWidthNumber } from "../../lib/utils";

const SPREADSHEET_ID = "1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI";
const PARTICIPANT_SHEET_ID = "83073925";
const PARTICIPANT_SHEET_RANGE = "A:O"; // 列追加に備えて多めに取得
const SPECIAL_EDITION_SHEET_ID = "1503676788";
const SPECIAL_EDITION_SHEET_RANGE = "C:G"; // 列追加に備えて多めに取得

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

// 挿入・更新用の型エイリアス
type BookstoreInsert = Database["public"]["Tables"]["bookstores"]["Insert"];

interface UpdateStats {
  newCount: number;
  updateCount: number;
  deleteCount: number;
  errorCount: number;
}

function normalizeAddress(address: string) {
  return convertToFullWidthNumber(address.replace(/−/, "－"));
}

function trimPrefectureSuffix(prefecture: string) {
  return prefecture.replace(/[都道府県]$/, "");
}

// 店舗データの比較（差分チェック）
function hasDataChanged(
  existing: Bookstore,
  newData: BookstoreInsert,
): boolean {
  const fieldsToCompare: (keyof BookstoreInsert)[] = [
    "number",
    "prefecture",
    "prefecture_number",
    "city",
    "registered_name",
    "name",
    "opening_hour",
    "establishment_year",
    "address",
    "special_edition",
    "close_info",
  ];

  return fieldsToCompare.some((field) => existing[field] !== newData[field]);
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
  log: Omit<UpdateLog, "id" | "created_at">,
) {
  const { error } = await supabase.from("update_logs").insert(log);

  if (error) {
    console.error("Error creating log:", error);
  }
}

const PARTICIPANT_EXPECTED_COLUMNS = [
  "登録番号",
  "都道府県",
  "市町村名",
  "登録店名",
  "創業年",
  "時間帯",
  "住所",
] as const;

/**
 * ヘッダ行から期待する列名のインデックスを取得する。
 * 列の追加・並び替え・重複があっても、各列名の「最初の出現」を使う。
 */
function parseParticipantHeader(header: string[]): {
  valid: boolean;
  indices: number[] | null;
  missing: string[];
} {
  const normalized = header.map((h) => h.trim());
  const indices: number[] = [];
  const missing: string[] = [];

  for (const name of PARTICIPANT_EXPECTED_COLUMNS) {
    const idx = normalized.indexOf(name);
    if (idx === -1) {
      missing.push(name);
    } else {
      indices.push(idx);
    }
  }

  return {
    valid: missing.length === 0,
    indices: missing.length === 0 ? indices : null,
    missing,
  };
}

const SPECIAL_EDITION_EXPECTED_COLUMNS = [
  "書店名",
  "都道府県",
  "住所",
] as const;

function parseSpecialEditionHeader(header: string[]): {
  valid: boolean;
  indices: number[] | null;
  missing: string[];
} {
  const normalized = header.map((h) => h.trim());
  const indices: number[] = [];
  const missing: string[] = [];

  for (const name of SPECIAL_EDITION_EXPECTED_COLUMNS) {
    const idx = normalized.indexOf(name);
    if (idx === -1) {
      missing.push(name);
    } else {
      indices.push(idx);
    }
  }

  return {
    valid: missing.length === 0,
    indices: missing.length === 0 ? indices : null,
    missing,
  };
}

export async function updateBookstoresService() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 既存の店舗データを取得
    const { data: existingBookstores, error: fetchError } = await supabase
      .from("bookstores")
      .select("*");

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing bookstores: ${fetchError.message}`,
      );
    }

    const existingBookstoreMap = new Map<number, Bookstore>();
    existingBookstores?.forEach((bookstore) => {
      existingBookstoreMap.set(bookstore.number, bookstore);
    });

    // 参加店リストの取得
    const participantRows = await fetchSheetData(
      PARTICIPANT_SHEET_ID,
      PARTICIPANT_SHEET_RANGE,
    );
    // ヘッダをチェック（期待する列名が含まれていればOK、インデックスで取得）
    const participantHeader = parseParticipantHeader(participantRows[0]);
    if (!participantHeader.valid || !participantHeader.indices) {
      throw new Error(
        `Invalid participant header: missing columns: ${participantHeader.missing.join(", ")}`,
      );
    }
    const pi = participantHeader.indices;
    const bookstores: BookstoreInsert[] = participantRows
      .slice(1)
      .map((row) => {
        const number = row[pi[0]];
        const prefecture = row[pi[1]];
        const city = row[pi[2]];
        const registered_name = row[pi[3]];
        const establishment_year = row[pi[4]];
        const opening_hour = row[pi[5]];
        const address = row[pi[6]];
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
          opening_hour: opening_hour || null,
          establishment_year: establishment_year || null,
          address: normalizeAddress(address),
          special_edition: false,
          close_info,
        };
      });

    // 特装版取扱店リストの取得
    const specialEditionRows = await fetchSheetData(
      SPECIAL_EDITION_SHEET_ID,
      SPECIAL_EDITION_SHEET_RANGE,
    );
    // ヘッダをチェック（期待する列名が含まれていればOK）
    const specialEditionHeader = parseSpecialEditionHeader(
      specialEditionRows[0],
    );
    if (!specialEditionHeader.valid || !specialEditionHeader.indices) {
      throw new Error(
        `Invalid special edition header: missing columns: ${specialEditionHeader.missing.join(", ")}`,
      );
    }
    const si = specialEditionHeader.indices;
    const specialEditionBookstores = specialEditionRows.slice(1).map((row) => ({
      name: row[si[0]],
      prefecture: row[si[1]],
      address: row[si[2]],
    }));

    // 新しいデータのマップを作成
    const newBookstoreMap = new Map<number, BookstoreInsert>();
    bookstores.forEach((bookstore) => {
      const isSpecialEdition = specialEditionBookstores.some(
        (special) =>
          special.name === bookstore.name &&
          trimPrefectureSuffix(special.prefecture) ===
            trimPrefectureSuffix(bookstore.prefecture),
      );

      newBookstoreMap.set(bookstore.number, {
        ...bookstore,
        special_edition: isSpecialEdition,
      });
    });

    // 更新統計
    const stats: UpdateStats = {
      newCount: 0,
      updateCount: 0,
      deleteCount: 0,
      errorCount: 0,
    };

    // 新規・更新処理
    for (const [number, newBookstore] of newBookstoreMap) {
      const existingBookstore = existingBookstoreMap.get(number);

      if (!existingBookstore) {
        // 新規店舗
        const { error } = await supabase
          .from("bookstores")
          .insert(newBookstore);
        if (error) {
          console.error(`Error inserting new bookstore ${number}:`, error);
          stats.errorCount++;
        } else {
          stats.newCount++;
        }
      } else if (hasDataChanged(existingBookstore, newBookstore)) {
        // 既存店舗の更新（差分がある場合のみ）
        const { error } = await supabase
          .from("bookstores")
          .update(newBookstore)
          .eq("number", number);
        if (error) {
          console.error(`Error updating bookstore ${number}:`, error);
          stats.errorCount++;
        } else {
          stats.updateCount++;
        }
      }
      // 差分がない場合はスキップ（何もしない）
    }

    // 削除対象店舗の確認（物理削除は行わない）
    const deleteCandidates: number[] = [];
    for (const [number] of existingBookstoreMap) {
      if (!newBookstoreMap.has(number)) {
        deleteCandidates.push(number);
        stats.deleteCount++;
      }
    }

    // 削除対象店舗をログ出力
    if (deleteCandidates.length > 0) {
      console.log(
        `削除対象店舗 (${deleteCandidates.length}件):`,
        deleteCandidates.sort((a, b) => a - b),
      );
    }

    // 変更がある場合またはエラーがある場合のみログを作成
    const hasChanges =
      stats.newCount > 0 || stats.updateCount > 0 || stats.deleteCount > 0;
    const hasErrors = stats.errorCount > 0;

    if (hasChanges || hasErrors) {
      // ログメッセージの作成
      const messageParts: string[] = [];
      if (stats.newCount > 0) messageParts.push(`新規 ${stats.newCount} 件`);
      if (stats.updateCount > 0)
        messageParts.push(`更新 ${stats.updateCount} 件`);
      if (stats.deleteCount > 0)
        messageParts.push(`削除対象 ${stats.deleteCount} 件`);

      const message = hasChanges
        ? `店舗情報を更新しました: ${messageParts.join(", ")}`
        : "店舗情報に変更はありませんでした";

      // 更新ログの作成
      await createLog(supabase, {
        status: stats.errorCount === 0 ? "success" : "error",
        message:
          stats.errorCount === 0
            ? message
            : `${message}。${stats.errorCount} 件の処理に失敗しました`,
        error_details:
          stats.errorCount > 0
            ? `${stats.errorCount} 件の店舗の処理に失敗しました`
            : null,
      });
    }

    return [
      stats.errorCount === 0,
      stats.newCount + stats.updateCount,
      stats.errorCount,
    ];
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
