# 開発メモ

## 開発開始方法

#### DB

supabase がインストールされていなければ入れる https://supabase.com/docs/guides/local-development/cli/getting-started

```bash
# 開発用DBを起動
supabase start
```

[ダッシュボード（http://localhost:54323/project/default）](http://localhost:54323/project/default) にアクセスする

#### アプリケーション

`.env.local.example` を元に `.env.local` を作成

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)にアクセスする

#### バッチ処理

```bash
# 開発用のtriggerを起動
npm run trigger:dev
```

下記 URL からローカル環境のタスクを実行できる

https://cloud.trigger.dev/orgs/ise-21ee/projects/v3/goshoin-iFiU/test

## 知見

公開されているスプレッドシートは ↓ のようにアクセスするだけで CSV データがダウンロードできるらしい（cursor まじプログラミングオタク）

- 参加順店舗リスト
  - https://docs.google.com/spreadsheets/d/1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI/gviz/tq?tqx=out:csv&gid=1460657161&range=A:G
- 特装版取扱店舗リスト
  - https://docs.google.com/spreadsheets/d/1t52cnKT6vDkchIEJ_FmIzAobCIMbgUXBGF_nuQEVaOI/gviz/tq?tqx=out:csv&gid=1503676788&range=C:E
