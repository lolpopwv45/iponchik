-- Новый заказ сразу идёт на кухню, без шага подтверждения.

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'Готовится';

UPDATE public.orders
SET status = 'Готовится'
WHERE status IN ('Не подтвержден', 'Подтвержден');
