// 半角数字を全角数字に変換するマッピング
const HALF_TO_FULL_NUMBER: { [key: string]: string } = {
  "0": "０",
  "1": "１",
  "2": "２",
  "3": "３",
  "4": "４",
  "5": "５",
  "6": "６",
  "7": "７",
  "8": "８",
  "9": "９",
};

/**
 * 半角数字を全角数字に変換する
 * @param str 変換する文字列
 * @returns 変換後の文字列
 */
export function convertToFullWidthNumber(str: string): string {
  return str.replace(/[0-9]/g, (match) => HALF_TO_FULL_NUMBER[match] || match);
}
