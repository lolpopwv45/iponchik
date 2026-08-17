-- Клиент не вышел на связь: статус «Отказ» после «Не подтвержден».

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Не подтвержден', 'Отказ', 'Подтвержден', 'Готовится', 'В доставке', 'Готов/Выдан'));
