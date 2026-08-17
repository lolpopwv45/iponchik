-- RLS для заказов: витрина может только создавать заявку,
-- чтение/изменение/удаление — только сотрудники (authenticated).
-- Также ограничиваем длину ПДн, чтобы нельзя было обойти форму через Data API.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order status" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can delete orders" ON public.orders;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_name_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_name_len_check
  CHECK (char_length(customer_name) BETWEEN 1 AND 80);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_phone_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_phone_len_check
  CHECK (char_length(phone) BETWEEN 10 AND 20);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_comment_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_comment_len_check
  CHECK (comment IS NULL OR char_length(comment) <= 500);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_address_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_address_len_check
  CHECK (address IS NULL OR char_length(address) <= 200);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_apartment_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_apartment_len_check
  CHECK (apartment IS NULL OR char_length(apartment) <= 20);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_entrance_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_entrance_len_check
  CHECK (entrance IS NULL OR char_length(entrance) <= 20);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_intercom_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_intercom_len_check
  CHECK (intercom IS NULL OR char_length(intercom) <= 20);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_time_label_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_time_label_len_check
  CHECK (time_label IS NULL OR char_length(time_label) <= 80);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_items_len_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_items_len_check
  CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 0 AND 50);

-- INSERT: любой посетитель витрины (anon) может оформить заказ.
CREATE POLICY "Public can create orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(customer_name)) BETWEEN 1 AND 80
    AND char_length(phone) BETWEEN 10 AND 20
    AND (comment IS NULL OR char_length(comment) <= 500)
    AND (address IS NULL OR char_length(address) <= 200)
    AND (apartment IS NULL OR char_length(apartment) <= 20)
    AND (entrance IS NULL OR char_length(entrance) <= 20)
    AND (intercom IS NULL OR char_length(intercom) <= 20)
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) BETWEEN 1 AND 50
    AND subtotal >= 0
    AND delivery_fee >= 0
    AND total >= 0
    AND total <= 1000000
  );

-- SELECT: только авторизованные сотрудники.
CREATE POLICY "Authenticated can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- UPDATE: смена статусов только сотрудниками.
CREATE POLICY "Authenticated can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DELETE: публично запрещено; сотрудникам разрешено.
CREATE POLICY "Authenticated can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

REVOKE ALL ON TABLE public.orders FROM PUBLIC;
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.orders FROM authenticated;

GRANT INSERT ON TABLE public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;

-- Возвращает номер заказа витрине без SELECT по всей таблице.
CREATE OR REPLACE FUNCTION public.place_storefront_order(
  p_customer_name text,
  p_phone text,
  p_comment text,
  p_fulfillment text,
  p_address text,
  p_apartment text,
  p_entrance text,
  p_intercom text,
  p_lat double precision,
  p_lng double precision,
  p_time_mode text,
  p_time_label text,
  p_items jsonb,
  p_subtotal integer,
  p_delivery_fee integer,
  p_total integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number text;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_address text := nullif(btrim(coalesce(p_address, '')), '');
  v_apartment text := nullif(btrim(coalesce(p_apartment, '')), '');
  v_entrance text := nullif(btrim(coalesce(p_entrance, '')), '');
  v_intercom text := nullif(btrim(coalesce(p_intercom, '')), '');
  v_time_label text := nullif(btrim(coalesce(p_time_label, '')), '');
  v_time_mode text := CASE WHEN p_time_mode IN ('asap', 'slot') THEN p_time_mode ELSE 'asap' END;
BEGIN
  IF char_length(v_name) < 1 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid_customer_name' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_phone) < 10 OR char_length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE = '22023';
  END IF;

  IF v_comment IS NOT NULL AND char_length(v_comment) > 500 THEN
    RAISE EXCEPTION 'invalid_comment' USING ERRCODE = '22023';
  END IF;

  IF p_fulfillment NOT IN ('pickup', 'delivery') THEN
    RAISE EXCEPTION 'invalid_fulfillment' USING ERRCODE = '22023';
  END IF;

  IF p_fulfillment = 'delivery' AND (v_address IS NULL OR char_length(v_address) < 5 OR char_length(v_address) > 200) THEN
    RAISE EXCEPTION 'invalid_address' USING ERRCODE = '22023';
  END IF;

  IF v_apartment IS NOT NULL AND char_length(v_apartment) > 20 THEN
    RAISE EXCEPTION 'invalid_apartment' USING ERRCODE = '22023';
  END IF;

  IF v_entrance IS NOT NULL AND char_length(v_entrance) > 20 THEN
    RAISE EXCEPTION 'invalid_entrance' USING ERRCODE = '22023';
  END IF;

  IF v_intercom IS NOT NULL AND char_length(v_intercom) > 20 THEN
    RAISE EXCEPTION 'invalid_intercom' USING ERRCODE = '22023';
  END IF;

  IF v_time_label IS NOT NULL AND char_length(v_time_label) > 80 THEN
    RAISE EXCEPTION 'invalid_time_label' USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'invalid_items' USING ERRCODE = '22023';
  END IF;

  IF p_subtotal IS NULL OR p_delivery_fee IS NULL OR p_total IS NULL
     OR p_subtotal < 0 OR p_delivery_fee < 0 OR p_total < 0 OR p_total > 1000000 THEN
    RAISE EXCEPTION 'invalid_amounts' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (
    customer_name,
    phone,
    comment,
    fulfillment,
    address,
    apartment,
    entrance,
    intercom,
    lat,
    lng,
    time_mode,
    time_label,
    items,
    subtotal,
    delivery_fee,
    total
  )
  VALUES (
    v_name,
    v_phone,
    v_comment,
    p_fulfillment,
    CASE WHEN p_fulfillment = 'delivery' THEN v_address ELSE NULL END,
    CASE WHEN p_fulfillment = 'delivery' THEN v_apartment ELSE NULL END,
    CASE WHEN p_fulfillment = 'delivery' THEN v_entrance ELSE NULL END,
    CASE WHEN p_fulfillment = 'delivery' THEN v_intercom ELSE NULL END,
    CASE WHEN p_fulfillment = 'delivery' THEN p_lat ELSE NULL END,
    CASE WHEN p_fulfillment = 'delivery' THEN p_lng ELSE NULL END,
    v_time_mode,
    v_time_label,
    p_items,
    p_subtotal,
    p_delivery_fee,
    p_total
  )
  RETURNING order_number INTO v_order_number;

  RETURN v_order_number;
END;
$$;

REVOKE ALL ON FUNCTION public.place_storefront_order(
  text, text, text, text, text, text, text, text, double precision, double precision,
  text, text, jsonb, integer, integer, integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.place_storefront_order(
  text, text, text, text, text, text, text, text, double precision, double precision,
  text, text, jsonb, integer, integer, integer
) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_order_number() FROM anon;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO authenticated, service_role;

REVOKE USAGE, SELECT, UPDATE ON SEQUENCE public.order_number_seq FROM anon;
REVOKE USAGE, SELECT, UPDATE ON SEQUENCE public.categories_id_seq FROM anon;
REVOKE USAGE, SELECT, UPDATE ON SEQUENCE public.products_id_seq FROM anon;

-- Каталог: чтение публичное, запись только сотрудникам.
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can delete categories" ON public.categories;

CREATE POLICY "Authenticated can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;

CREATE POLICY "Authenticated can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated');

REVOKE INSERT, UPDATE, DELETE ON TABLE public.categories FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.products FROM anon;
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;

CREATE POLICY "Authenticated can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
