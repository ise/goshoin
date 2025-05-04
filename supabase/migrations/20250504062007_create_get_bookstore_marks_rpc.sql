-- Function to get want/visited status for a list of bookstores for the current user

CREATE OR REPLACE FUNCTION public.get_bookstore_marks(p_bookstore_ids uuid[])
RETURNS TABLE(bookstore_id uuid, is_want boolean, is_visited boolean)
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer security to reliably use next_auth.uid()
AS $$
DECLARE
  v_user_id uuid := next_auth.uid(); -- Get the current user's ID from the JWT
BEGIN
  -- If no user is logged in, return nothing (or handle as needed)
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT uuid_generate_v4(), false, false WHERE false; -- Return empty set trick
    -- Or alternatively, raise an exception:
    -- RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    b.id AS bookstore_id,
    EXISTS (
      SELECT 1
      FROM public.want_to_go_bookstores w
      WHERE w.bookstore_id = b.id AND w.user_id = v_user_id
    ) AS is_want,
    EXISTS (
      SELECT 1
      FROM public.visited_bookstores v
      WHERE v.bookstore_id = b.id AND v.user_id = v_user_id
    ) AS is_visited
  FROM
    -- Unnest the input array of bookstore IDs into a temporary table-like structure
    unnest(p_bookstore_ids) AS b(id);

END;
$$;

-- Grant execute permission to the authenticated role
-- Note: Since we use SECURITY DEFINER and next_auth.uid(), the function itself enforces
--       that only the logged-in user's marks are considered. Granting execute to 'authenticated'
--       allows any logged-in user to call the function.
GRANT EXECUTE ON FUNCTION public.get_bookstore_marks(uuid[]) TO authenticated;

-- (Optional but recommended) Grant usage on the function's return types if needed by specific roles,
-- although generally covered by granting EXECUTE.
