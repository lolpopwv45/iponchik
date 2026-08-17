-- Снова принимаем заказ как «Не подтвержден», чтобы его можно было подтвердить вручную.

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'Не подтвержден';
