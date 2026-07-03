-- ====================================================================
-- MIGRACIÓN DE RESPALDO: CAMBIAR TIPO DE NUM_FACTURA A TEXT EN VENTAS
-- ====================================================================
-- Ejecuta este código en el SQL Editor de Supabase (https://app.supabase.com/)
-- si experimentas errores de tipo al intentar emitir facturas con prefijos.

ALTER TABLE public.ventas ALTER COLUMN num_factura TYPE text;
