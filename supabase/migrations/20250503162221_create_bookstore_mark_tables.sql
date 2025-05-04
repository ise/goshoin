-- want_to_go_bookstores テーブルを作成
create table public.want_to_go_bookstores (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bookstore_id uuid not null references public.bookstores(id) on delete cascade, -- bookstores.id を参照
  memo text,
  is_public boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  -- ユーザーごとに同じ書店を複数登録できないように複合ユニーク制約
  constraint want_to_go_bookstores_user_id_bookstore_id_key unique (user_id, bookstore_id)
);
comment on table public.want_to_go_bookstores is 'Stores users want to visit.';

-- visited_bookstores テーブルを作成
create table public.visited_bookstores (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bookstore_id uuid not null references public.bookstores(id) on delete cascade, -- bookstores.id を参照
  memo text,
  is_public boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  -- ユーザーごとに同じ書店を複数登録できないように複合ユニーク制約
  constraint visited_bookstores_user_id_bookstore_id_key unique (user_id, bookstore_id)
);
comment on table public.visited_bookstores is 'Stores users have visited.';

-- RLS を両方のテーブルで有効化
alter table public.want_to_go_bookstores enable row level security;
alter table public.visited_bookstores enable row level security;

-- want_to_go_bookstores の RLS ポリシー
create policy "Allow authenticated read access for want_to_go" on public.want_to_go_bookstores for select using (auth.role() = 'authenticated'); -- ポリシー名変更
create policy "Allow individual insert access for want_to_go" on public.want_to_go_bookstores for insert with check (auth.uid() = user_id); -- ポリシー名変更
create policy "Allow individual update access for want_to_go" on public.want_to_go_bookstores for update using (auth.uid() = user_id) with check (auth.uid() = user_id); -- ポリシー名変更
create policy "Allow individual delete access for want_to_go" on public.want_to_go_bookstores for delete using (auth.uid() = user_id); -- ポリシー名変更

-- visited_bookstores の RLS ポリシー
create policy "Allow authenticated read access for visited" on public.visited_bookstores for select using (auth.role() = 'authenticated'); -- ポリシー名変更
create policy "Allow individual insert access for visited" on public.visited_bookstores for insert with check (auth.uid() = user_id); -- ポリシー名変更
create policy "Allow individual update access for visited" on public.visited_bookstores for update using (auth.uid() = user_id) with check (auth.uid() = user_id); -- ポリシー名変更
create policy "Allow individual delete access for visited" on public.visited_bookstores for delete using (auth.uid() = user_id); -- ポリシー名変更

-- updated_at を自動更新するトリガーを両テーブルに追加
-- (関数 handle_updated_at は profiles テーブル作成時に作られているはずなので、トリガーだけ作成)
create trigger on_want_to_go_bookstores_updated
  before update on public.want_to_go_bookstores
  for each row execute procedure public.handle_updated_at();

create trigger on_visited_bookstores_updated
  before update on public.visited_bookstores
  for each row execute procedure public.handle_updated_at();
