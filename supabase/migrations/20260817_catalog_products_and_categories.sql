-- Каталог: категории меню, товары и публичные фото.

CREATE TABLE IF NOT EXISTS public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_check CHECK (length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON public.categories (name);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories (sort_order, name);

CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id bigint NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  price integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  weight_grams integer NOT NULL,
  proteins numeric(8, 2) NOT NULL DEFAULT 0,
  fats numeric(8, 2) NOT NULL DEFAULT 0,
  carbs numeric(8, 2) NOT NULL DEFAULT 0,
  calories numeric(8, 2) NOT NULL DEFAULT 0,
  badges text[] NOT NULL DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_name_check CHECK (length(btrim(name)) > 0),
  CONSTRAINT products_price_check CHECK (price >= 0),
  CONSTRAINT products_weight_grams_check CHECK (weight_grams > 0),
  CONSTRAINT products_nutrition_check CHECK (
    proteins >= 0 AND fats >= 0 AND carbs >= 0 AND calories >= 0
  )
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON public.products (sort_order, name);

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
CREATE POLICY "Anyone can insert categories" ON public.categories
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
CREATE POLICY "Anyone can update categories" ON public.categories
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;
CREATE POLICY "Anyone can delete categories" ON public.categories
  FOR DELETE TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
CREATE POLICY "Anyone can insert products" ON public.products
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
CREATE POLICY "Anyone can update products" ON public.products
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
CREATE POLICY "Anyone can delete products" ON public.products
  FOR DELETE TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.products TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
CREATE POLICY "Anyone can upload product images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
CREATE POLICY "Anyone can update product images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
CREATE POLICY "Anyone can delete product images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'product-images');

INSERT INTO public.categories (name, sort_order)
SELECT seed.name, seed.sort_order
FROM (
  VALUES
    ('Пиццы', 10),
    ('Пирожки', 20),
    ('Десерты', 30)
) AS seed(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories existing WHERE existing.name = seed.name
);

INSERT INTO public.products (
  name,
  description,
  category_id,
  price,
  in_stock,
  image_url,
  weight_grams,
  proteins,
  fats,
  carbs,
  calories,
  badges,
  sort_order
)
SELECT seed.name, seed.description, categories.id, seed.price, true, seed.image_url,
       seed.weight_grams, seed.proteins, seed.fats, seed.carbs, seed.calories,
       seed.badges, seed.sort_order
FROM (
  VALUES
    ('Пицца Маргарита', 'Томатный соус, моцарелла, свежий базилик', 'Пиццы', 420, '/images/product-pizza.png', 450, 11.50, 9.80, 28.40, 248.00, ARRAY['meatless']::text[], 10),
    ('Пицца Пепперони', 'Острая пепперони и плавленый сыр', 'Пиццы', 460, '/images/product-pizza-pepperoni.png', 480, 13.20, 14.50, 26.10, 288.40, ARRAY['spicy']::text[], 20),
    ('Пирожок с мясом', 'Сочная мясная начинка в золотистом тесте', 'Пирожки', 110, '/images/product-pirozhok.png', 90, 10.10, 12.30, 32.80, 281.00, ARRAY[]::text[], 10),
    ('Пончик классический', 'Нежное тесто с розовой глазурью и посыпкой', 'Десерты', 89, '/images/product-donut-classic.png', 70, 5.40, 18.20, 48.50, 377.00, ARRAY['meatless']::text[], 10),
    ('Пончик шоколадный', 'Шоколадная глазурь и шоколадная крошка', 'Десерты', 95, '/images/product-donut-chocolate.png', 75, 5.80, 19.40, 49.20, 392.60, ARRAY['meatless', 'new']::text[], 20),
    ('Синнабон с корицей', 'Булочка с корицей и кремовой глазурью', 'Десерты', 150, '/images/product-cinnamon-roll.png', 140, 6.20, 16.80, 52.40, 384.00, ARRAY['meatless', 'new']::text[], 30)
) AS seed(name, description, category_name, price, image_url, weight_grams, proteins, fats, carbs, calories, badges, sort_order)
JOIN public.categories ON categories.name = seed.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.products existing WHERE existing.name = seed.name
);
