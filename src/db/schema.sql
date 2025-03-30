-- bookstoresテーブルの作成
create table bookstores (
  id uuid default uuid_generate_v4() primary key,
  number integer not null unique,
  prefecture text not null,
  prefecture_number integer not null,
  city text not null,
  registered_name text not null,
  name text not null,
  opening_hour text,
  establishment_year text,
  address text,
  special_edition boolean not null default false,
  close_info text
);

-- update_logsテーブルの作成
create table update_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('success', 'error')),
  message text not null,
  error_details text
);

-- RLSポリシーの設定
alter table bookstores enable row level security;
alter table update_logs enable row level security;

-- bookstoresテーブルのポリシー
create policy "Enable read access for all users" on bookstores
  for select using (true);

create policy "Enable insert for authenticated users only" on bookstores
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on bookstores
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on bookstores
  for delete using (auth.role() = 'authenticated');

-- update_logsテーブルのポリシー
create policy "Enable read access for all users" on update_logs
  for select using (true);

create policy "Enable insert for authenticated users only" on update_logs
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on update_logs
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on update_logs
  for delete using (auth.role() = 'authenticated');
