-- public.mark_bookstore_as_visited 関数を作成
create or replace function public.mark_bookstore_as_visited (
  p_user_id uuid,
  p_bookstore_id uuid
)
returns void
language plpgsql
security definer -- この関数を定義したユーザー（通常はpostgres）の権限で実行
set search_path = public -- search_path を指定して public スキーマのテーブルを参照
as $$
begin
  -- 1. visited_bookstores に挿入（存在する場合は何もしない）
  insert into visited_bookstores (user_id, bookstore_id)
  values (p_user_id, p_bookstore_id)
  on conflict (user_id, bookstore_id) do nothing;

  -- 2. want_to_go_bookstores から削除（存在する場合）
  delete from want_to_go_bookstores
  where user_id = p_user_id and bookstore_id = p_bookstore_id;
end;
$$;
