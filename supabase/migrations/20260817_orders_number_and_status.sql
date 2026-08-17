-- Цикл заказа: уникальный номер, статусы, состав, RLS.
-- Выполните в SQL Editor Supabase, если миграция ещё не применялась.

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1040 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '№ ' || nextval('public.order_number_seq')::text;
END;
$$;

REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE DEFAULT public.next_order_number(),
  status text NOT NULL DEFAULT 'Не подтвержден',
  customer_name text NOT NULL,
  phone text NOT NULL,
  comment text,
  fulfillment text NOT NULL DEFAULT 'pickup',
  address text,
  apartment text,
  entrance text,
  intercom text,
  lat double precision,
  lng double precision,
  time_mode text NOT NULL DEFAULT 'asap',
  time_label text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal integer NOT NULL DEFAULT 0,
  delivery_fee integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS apartment text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS entrance text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intercom text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS time_mode text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS time_label text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT public.next_order_number();
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'Не подтвержден';
ALTER TABLE public.orders ALTER COLUMN items SET DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ALTER COLUMN subtotal SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN delivery_fee SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN total SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN fulfillment SET DEFAULT 'pickup';
ALTER TABLE public.orders ALTER COLUMN time_mode SET DEFAULT 'asap';
ALTER TABLE public.orders ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.orders ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.orders SET status = 'Не подтвержден'
  WHERE status IS NULL OR status IN ('Новый', 'new', 'New');
UPDATE public.orders SET status = 'Готов/Выдан'
  WHERE status IN ('Готов к выдаче', 'Готов');
UPDATE public.orders SET fulfillment = 'pickup' WHERE fulfillment IS NULL;
UPDATE public.orders SET time_mode = 'asap' WHERE time_mode IS NULL;
UPDATE public.orders SET items = '[]'::jsonb WHERE items IS NULL;
UPDATE public.orders SET subtotal = 0 WHERE subtotal IS NULL;
UPDATE public.orders SET delivery_fee = 0 WHERE delivery_fee IS NULL;
UPDATE public.orders SET total = 0 WHERE total IS NULL;
UPDATE public.orders SET created_at = now() WHERE created_at IS NULL;
UPDATE public.orders SET updated_at = now() WHERE updated_at IS NULL;
UPDATE public.orders
SET order_number = public.next_order_number()
WHERE order_number IS NULL OR btrim(order_number) = '';

ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN fulfillment SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN items SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_fee SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Не подтвержден', 'Подтвержден', 'Готовится', 'В доставке', 'Готов/Выдан'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfillment_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfillment_check
  CHECK (fulfillment IN ('pickup', 'delivery'));

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
CREATE POLICY "Anyone can read orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can update order status" ON public.orders;
CREATE POLICY "Anyone can update order status" ON public.orders
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
