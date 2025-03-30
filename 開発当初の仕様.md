# 非公式御書印プロジェクト参加店検索サービス

* このサービスは「非公式」の御書印プロジェクト参加店検索サービスです
* 御書印プロジェクトに参加している店舗について検索することができます
* 都道府県、市区町村、店舗名から参加店舗を検索することができます

# 利用技術

* 利用言語：TypeScript
* フロントエンド：Next.js
* UIフレームワーク：Tailwind CSS、shadcn/ui
* バックエンド：Next.js (API Routes)
* バッチ処理：Trigger.dev
* DB：supabase
* ホスティング：Vercel

# ページ構成及び、画面構成

## トップページ

* パス `/`
* 画面仕様
  * ヘッダに「"非公式"御書印参加店舗検索奴」と表示
  * bookstoresテーブルの内容から、店舗一覧を表形式で表示する
  * 20件ずつページネーションする
  * 表示項目は以下の通りとする
    * 登録番号： bookstores.number
    * 店名： bookstores.registered_name
    * 時間帯： bookstores.opening_hour
    * 住所： bookstores.prefecture、bookstores.address
    * 特装版取扱： bookstores.special_editionがtrueであれば「あり」と表示
  * 検索ボックスがあり、bookstores.name、bookstores.prefecture、bookstores.addressに対して全文検索することで店舗一覧を絞り込む
  * 免責として「最新の情報は、[御書印プロジェクト公式note](https://note.com/goshoin/n/ndd270b812fb5)や各書店のHPなどでご確認ください。」と表示

# DBスキーマ

## bookstoresテーブル

| カラム名 | 型 | null | 補足 |
| --- | --- | --- | --- |
| id | uuid | not null | 主キー（自動生成） |
| number | integer | not null | 御書印参加店リストの「登録番号」列の値を保持 |
| prefecture | text | not null | 御書印参加店リストの「都道府県など」列の値を保持 |
| prefecture_number | integer | not null | prefectureから都道府県コードへ変換したもの。日本の都道府県以外の場合は0 |
| city | text | not null | 御書印参加店リストの「市町村名」列の値を保持 |
| registered_name | text | not null | 御書印参加店リストの「登録店名」列の値を保持 |
| name | text | not null | 店名 |
| opening_hour | text | nullable | 御書印参加店リストの「時間帯」列の値を保持 |
| establishment_year | text | nullable | 御書印参加店リストの「創業年」列の値を保持 |
| address | text | not null | 御書印参加店リストの「住所」列の値を保持 |
| special_edition | boolean | not null | 特装版取扱店の場合true、それ以外の場合false |
| close_info | text | nullable | 閉店情報 |

# バッチ処置

## bookstoresテーブル更新ジョブ

* 1日1回実行
* 次のスプレッドシート（参加順リストシート）を読み取りbookstoresテーブルを更新する
  * https://docs.google.com/spreadsheets/d/1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI/edit?gid=1460657161#gid=1460657161
  * 「登録番号」列の値をキーにしてbookstoresテーブルに存在するデータかどうかチェック
  * すでに存在している場合
    * 各列と各カラムの内容を比較し、差分があれば更新する
  * まだ存在しない場合
    * 各列の情報を元に新規レコードとして登録する
  * name列はregisterd_nameの値から `/【(.+?)】/` を除去した値を記録する
  * prefecture_number列はprefectureの値から都道府県コードに変換した値を記録する
* 次のスプレッドシート（特装版取扱シート）を読み取りbookstoresテーブルのspecial_editionカラムを更新する
  * https://docs.google.com/spreadsheets/d/1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI/edit?gid=1503676788#gid=1503676788
  * 「書店名」列の値とbookstoresテーブルのnameカラムの値を比較、「都道府県」列の値とbookstoresテーブルのprefectureカラムの値を比較、「住所」列の値とbookstoresテーブルのaddressカラムの値を比較する
  * すべてが一致した場合、そのレコードのspecial_editionカラムをtrueで更新する
  * 逆に、bookstoresテーブルのspecial_editionカラムがtrueのレコードが「特装版取扱シート」に含まれていなければ、special_editionカラムをtrueで更新する
  * 更新内容をログに出力する


# 参考データ

## 都道府県コード

```
都道府県コード	都道府県名
1	北海道
2	青森県
3	岩手県
4	宮城県
5	秋田県
6	山形県
7	福島県
8	茨城県
9	栃木県
10	群馬県
11	埼玉県
12	千葉県
13	東京都
14	神奈川県
15	新潟県
16	富山県
17	石川県
18	福井県
19	山梨県
20	長野県
21	岐阜県
22	静岡県
23	愛知県
24	三重県
25	滋賀県
26	京都府
27	大阪府
28	兵庫県
29	奈良県
30	和歌山県
31	鳥取県
32	島根県
33	岡山県
34	広島県
35	山口県
36	徳島県
37	香川県
38	愛媛県
39	高知県
40	福岡県
41	佐賀県
42	長崎県
43	熊本県
44	大分県
45	宮崎県
46	鹿児島県
47	沖縄県
```
