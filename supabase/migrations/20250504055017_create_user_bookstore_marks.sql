-- updated_at を自動更新する関数 (もし他のマイグレーションで作ってなければ)
-- CREATE OR REPLACE FUNCTION public.handle_updated_at() ... の部分は前の profiles テーブルのマイグレーションにあったけど、
-- あのファイル消しちゃったから、改めてここで定義しとくのが安全かも！
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- want_to_go_bookstores テーブルの作成
CREATE TABLE public.want_to_go_bookstores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    bookstore_id uuid NOT NULL REFERENCES public.bookstores(id) ON DELETE CASCADE,
    memo text,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT want_to_go_bookstores_user_bookstore_unique UNIQUE (user_id, bookstore_id)
);

COMMENT ON TABLE public.want_to_go_bookstores IS 'User wishlist for bookstores';
COMMENT ON COLUMN public.want_to_go_bookstores.is_public IS 'Whether the entry is publicly visible';

-- visited_bookstores テーブルの作成
CREATE TABLE public.visited_bookstores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    bookstore_id uuid NOT NULL REFERENCES public.bookstores(id) ON DELETE CASCADE,
    memo text,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT visited_bookstores_user_bookstore_unique UNIQUE (user_id, bookstore_id)
);

COMMENT ON TABLE public.visited_bookstores IS 'User records of visited bookstores';
COMMENT ON COLUMN public.visited_bookstores.is_public IS 'Whether the entry is publicly visible';

-- updated_at トリガーの設定 (両方のテーブルに)
CREATE TRIGGER on_want_to_go_updated
    BEFORE UPDATE ON public.want_to_go_bookstores
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_visited_updated
    BEFORE UPDATE ON public.visited_bookstores
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS (行レベルセキュリティ) の有効化
ALTER TABLE public.want_to_go_bookstores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_bookstores ENABLE ROW LEVEL SECURITY;

-- want_to_go_bookstores の RLS ポリシー
-- SELECT: 自分のレコードか、公開されてるレコードなら見れる
CREATE POLICY "Allow read access based on ownership or public status"
    ON public.want_to_go_bookstores FOR SELECT
    USING (next_auth.uid() = user_id OR is_public = true);

-- INSERT: 自分のレコードとしてのみ追加できる
CREATE POLICY "Allow individual insert access"
    ON public.want_to_go_bookstores FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

-- UPDATE: 自分のレコードだけ更新できる
CREATE POLICY "Allow individual update access"
    ON public.want_to_go_bookstores FOR UPDATE
    USING (next_auth.uid() = user_id)
    WITH CHECK (next_auth.uid() = user_id); --念のため check も

-- DELETE: 自分のレコードだけ削除できる
CREATE POLICY "Allow individual delete access"
    ON public.want_to_go_bookstores FOR DELETE
    USING (next_auth.uid() = user_id);


-- visited_bookstores の RLS ポリシー
-- SELECT: 自分のレコードか、公開されてるレコードなら見れる
CREATE POLICY "Allow read access based on ownership or public status"
    ON public.visited_bookstores FOR SELECT
    USING (next_auth.uid() = user_id OR is_public = true); -- ランキング集計はバックエンドで service_role 想定

-- INSERT: 自分のレコードとしてのみ追加できる
CREATE POLICY "Allow individual insert access"
    ON public.visited_bookstores FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

-- UPDATE: 自分のレコードだけ更新できる
CREATE POLICY "Allow individual update access"
    ON public.visited_bookstores FOR UPDATE
    USING (next_auth.uid() = user_id)
    WITH CHECK (next_auth.uid() = user_id);

-- DELETE: 自分のレコードだけ削除できる
CREATE POLICY "Allow individual delete access"
    ON public.visited_bookstores FOR DELETE
    USING (next_auth.uid() = user_id);
