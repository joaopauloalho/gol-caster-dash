-- Adiciona coluna para armazenar o ID do pagamento no Mercado Pago
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_payment_id text;
