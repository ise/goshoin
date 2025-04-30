-- profiles テーブルを作成
create table public.profiles (
  id uuid not null default uuid_generate_v4() primary key,
  -- auth.users テーブルの id を参照する外部キー
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  -- user_id はユニークであるべき
  constraint profiles_user_id_key unique (user_id)
);

-- profiles テーブルのコメント設定 (任意)
comment on table public.profiles is 'User profile information linked to auth.users';
comment on column public.profiles.id is 'Primary key for the profile';
comment on column public.profiles.user_id is 'Links to the corresponding user in auth.users';
comment on column public.profiles.name is 'User''s display name';
comment on column public.profiles.avatar_url is 'URL of the user''s avatar image';

-- RLS (行レベルセキュリティ) を有効化
alter table public.profiles enable row level security;

-- RLS ポリシー: 認証済みユーザーは全てのプロファイルを読み取れる (必要に応じて変更: e.g., using (true) だと誰でも読める)
create policy "Allow authenticated read access" on public.profiles
  for select using (auth.role() = 'authenticated');

-- RLS ポリシー: ユーザーは自分のプロファイルのみを挿入できる
create policy "Allow individual insert access" on public.profiles
  for insert with check (auth.uid() = user_id);

-- RLS ポリシー: ユーザーは自分のプロファイルのみを更新できる
create policy "Allow individual update access" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- トリガー: updated_at カラムを自動更新する関数とトリガー (よくあるパターン)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
