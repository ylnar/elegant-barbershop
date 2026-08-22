-- ========================================================================
-- 0008_fix_transactions.sql
-- Fix fn_create_pos_transaction to handle non-UUID barber_id.
-- TANPA data dummy/transaksi contoh (database mulai dari 0).
-- ========================================================================

-- 1. FIX STORED PROCEDURE
-- Drop old version dan buat baru yang lebih robust
DROP FUNCTION IF EXISTS public.fn_create_pos_transaction(
    VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB, NUMERIC, NUMERIC, NUMERIC, VARCHAR, NUMERIC, NUMERIC, TEXT
);

CREATE OR REPLACE FUNCTION public.fn_create_pos_transaction(
    p_invoice_number VARCHAR(40),
    p_booking_id TEXT,
    p_customer_name VARCHAR(120),
    p_customer_phone VARCHAR(30),
    p_barber_id TEXT,
    p_barber_name VARCHAR(120),
    p_items JSONB,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total_amount NUMERIC,
    p_payment_method VARCHAR(30),
    p_amount_paid NUMERIC,
    p_change_amount NUMERIC,
    p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_new_trx public.transactions%ROWTYPE;
    v_inv VARCHAR(40);
    v_bcode VARCHAR(30) := NULL;
    v_booking_id UUID := NULL;
    v_barber_id UUID := NULL;
    v_item JSONB;
    v_item_srv_id UUID;
    v_item_name VARCHAR(150);
    v_item_price NUMERIC;
    v_item_qty INT;
    v_item_subtotal NUMERIC;
BEGIN
    -- 1. Auto generate invoice if not provided
    IF p_invoice_number IS NULL OR TRIM(p_invoice_number) = '' THEN
        v_inv := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_inv := p_invoice_number;
    END IF;

    -- 2. Safe UUID parse for booking_id
    IF p_booking_id IS NOT NULL AND LENGTH(p_booking_id) > 10 THEN
        BEGIN
            v_booking_id := p_booking_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_booking_id := NULL;
        END;
    END IF;

    -- 3. Safe UUID parse for barber_id
    IF p_barber_id IS NOT NULL AND LENGTH(p_barber_id) > 10 THEN
        BEGIN
            v_barber_id := p_barber_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_barber_id := NULL;
        END;
    END IF;

    -- 4. Fetch booking code if booking_id passed
    IF v_booking_id IS NOT NULL THEN
        SELECT booking_code INTO v_bcode FROM public.bookings WHERE id = v_booking_id;
    END IF;

    -- 5. Insert Master Transaction
    INSERT INTO public.transactions (
        invoice_number, booking_id, booking_code, customer_name, customer_phone,
        barber_id, barber_name, items, subtotal, discount,
        total_amount, payment_method, payment_status, amount_paid, change_amount, notes, created_at
    ) VALUES (
        v_inv, v_booking_id, v_bcode, p_customer_name, p_customer_phone,
        v_barber_id, p_barber_name, COALESCE(p_items, '[]'::JSONB), p_subtotal, COALESCE(p_discount, 0),
        p_total_amount, p_payment_method, 'paid', COALESCE(p_amount_paid, p_total_amount), COALESCE(p_change_amount, 0), p_notes, NOW()
    ) RETURNING * INTO v_new_trx;

    -- 6. Unpack items and insert into transaction_items
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_item_name := COALESCE(v_item->>'serviceName', 'Layanan Pangkas');
            v_item_price := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'unitPrice')::NUMERIC, 0);
            v_item_qty := COALESCE((v_item->>'qty')::INT, (v_item->>'quantity')::INT, 1);
            v_item_subtotal := v_item_price * v_item_qty;

            BEGIN
                v_item_srv_id := (v_item->>'serviceId')::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_item_srv_id := NULL;
            END;

            INSERT INTO public.transaction_items (
                transaction_id, service_id, service_name, unit_price, quantity, subtotal, created_at
            ) VALUES (
                v_new_trx.id, v_item_srv_id, v_item_name, v_item_price, v_item_qty, v_item_subtotal, NOW()
            );
        END LOOP;
    END IF;

    -- 7. Mark booking as completed if linked
    IF v_booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET status = 'completed', updated_at = NOW()
        WHERE id = v_booking_id;
    END IF;

    RETURN to_jsonb(v_new_trx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
