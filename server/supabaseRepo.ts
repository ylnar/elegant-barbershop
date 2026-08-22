import { getServerSupabase } from './supabase.ts';
import {
  Booking,
  Service,
  Barber,
  SystemSettings,
  Transaction,
} from '../src/types.ts';
import { INITIAL_SETTINGS } from '../src/data/initialData.ts';

export class SupabaseRepo {
  // --- Settings ---
  static async fetchSettings(): Promise<SystemSettings | null> {
    const client = getServerSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        ...INITIAL_SETTINGS,
        shopName: data.shop_name || data.shopName || INITIAL_SETTINGS.shopName,
        tagline: data.tagline || INITIAL_SETTINGS.tagline,
        address: data.address || INITIAL_SETTINGS.address,
        phone: data.phone || INITIAL_SETTINGS.phone,
        whatsappNumber: data.whatsapp_number || data.whatsappNumber || INITIAL_SETTINGS.whatsappNumber,
        isBookingOpen: data.is_booking_open !== undefined ? Boolean(data.is_booking_open) : (data.isBookingOpen !== undefined ? Boolean(data.isBookingOpen) : INITIAL_SETTINGS.isBookingOpen),
        walkInOnlyMessage: data.walk_in_only_message || data.walkInOnlyMessage || INITIAL_SETTINGS.walkInOnlyMessage,
        currentWalkInQueue: Number(data.active_lounge_queue ?? data.currentWalkInQueue ?? INITIAL_SETTINGS.currentWalkInQueue),
        estimatedWalkInWaitMinutes: Number(data.estimated_wait_minutes ?? data.estimatedWalkInWaitMinutes ?? INITIAL_SETTINGS.estimatedWalkInWaitMinutes),
      };
    } catch {
      return null;
    }
  }

  static async saveSettings(settings: SystemSettings): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.from('system_settings').upsert({
        id: 'default_settings',
        shop_name: settings.shopName,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        whatsapp_number: settings.whatsappNumber,
        is_booking_open: settings.isBookingOpen,
        walk_in_only_message: settings.walkInOnlyMessage,
        active_lounge_queue: settings.currentWalkInQueue,
        estimated_wait_minutes: settings.estimatedWalkInWaitMinutes,
        updated_at: new Date().toISOString(),
      });

      return !error;
    } catch {
      return false;
    }
  }

  // --- Services ---
  static async fetchServices(): Promise<Service[] | null> {
    const client = getServerSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('services')
        .select('*')
        .eq('is_deleted', false);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data.map((s: any) => ({
        id: String(s.id),
        name: s.name || s.nama || s.service_name || 'Layanan Pangkas',
        category: s.category_slug || s.category || s.kategori || 'haircut',
        price: Number(s.price ?? s.harga ?? 0),
        durationMinutes: Number(s.duration_minutes ?? s.durationMinutes ?? s.durasi ?? 35),
        description: s.description || s.deskripsi || '',
        badge: s.badge || undefined,
        isActive: s.is_active !== undefined ? Boolean(s.is_active) : (s.isActive !== undefined ? Boolean(s.isActive) : true),
      }));
    } catch {
      return null;
    }
  }

  static async insertService(service: Service): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.from('services').insert({
        name: service.name,
        category_slug: service.category,
        price: service.price,
        duration_minutes: service.durationMinutes,
        description: service.description,
        badge: service.badge || null,
        is_active: service.isActive,
      });
      return !error;
    } catch {
      return false;
    }
  }

  static async updateService(id: string, updates: Partial<Service>): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.category) payload.category_slug = updates.category;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.badge !== undefined) payload.badge = updates.badge;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { error } = await client.from('services').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  static async deleteService(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.from('services').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  static async restoreService(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('services').update({
        is_deleted: false,
        deleted_at: null,
      }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Barbers ---
  static async fetchBarbers(): Promise<Barber[] | null> {
    const client = getServerSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('barbers')
        .select('*')
        .eq('is_deleted', false);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data.map((b: any) => ({
        id: String(b.id),
        name: b.name || 'Barber',
        phone: b.phone || undefined,
        isActive: b.is_active !== undefined ? Boolean(b.is_active) : true,
        workingDays: Array.isArray(b.working_days) ? b.working_days : [0, 1, 2, 3, 4, 5, 6],
      }));
    } catch {
      return null;
    }
  }

  static async insertBarber(barber: Barber): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.from('barbers').insert({
        name: barber.name,
        phone: barber.phone || null,
        is_active: barber.isActive,
        working_days: barber.workingDays,
      });
      return !error;
    } catch {
      return false;
    }
  }

  static async updateBarber(id: string, updates: Partial<Barber>): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.phone !== undefined) payload.phone = updates.phone || null;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.workingDays) payload.working_days = updates.workingDays;

      const { error } = await client.from('barbers').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  static async deleteBarber(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('barbers').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  static async restoreBarber(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('barbers').update({
        is_deleted: false,
        deleted_at: null,
      }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Bookings ---
  static async fetchBookings(): Promise<Booking[] | null> {
    const client = getServerSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .eq('is_deleted', false);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data.map((b: any) => ({
        id: String(b.id),
        bookingCode: b.booking_code || b.bookingCode || `ELG-${String(b.id).slice(-4)}`,
        customerName: b.customer_name || b.customerName || 'Pelanggan',
        customerPhone: b.customer_phone || b.customerPhone || '',
        customerEmail: b.customer_email || b.customerEmail || undefined,
        serviceId: String(b.service_id || b.serviceId || 'srv-1'),
        serviceName: b.service_name || b.serviceName || 'Layanan Pangkas',
        servicePrice: Number(b.service_price ?? b.servicePrice ?? 0),
        barberId: String(b.barber_id || b.barberId || 'any'),
        barberName: b.barber_name || b.barberName || 'Barber Siap Pertama',
        date: typeof b.date === 'string' ? b.date.split('T')[0] : b.date,
        timeSlot: b.time_slot || b.timeSlot || '10:00',
        totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
        status: b.status || 'pending',
        notes: b.notes || undefined,
        isWalkIn: Boolean(b.is_walk_in ?? b.isWalkIn ?? false),
        createdAt: b.created_at || b.createdAt || new Date().toISOString(),
        updatedAt: b.updated_at || b.updatedAt || b.created_at || new Date().toISOString(),
      }));
    } catch {
      return null;
    }
  }

  static async insertBooking(booking: Booking): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.from('bookings').insert({
        booking_code: booking.bookingCode,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail || null,
        service_id: booking.serviceId.length > 20 ? booking.serviceId : null,
        service_name: booking.serviceName,
        service_category: 'haircut',
        service_price: booking.servicePrice,
        barber_id: booking.barberId.length > 20 ? booking.barberId : null,
        barber_name: booking.barberName,
        date: booking.date,
        time_slot: booking.timeSlot,
        total_amount: booking.totalAmount,
        status: booking.status,
        is_walk_in: booking.isWalkIn,
      });

      return !error;
    } catch {
      return false;
    }
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.status) payload.status = updates.status;
      if (updates.customerName) payload.customer_name = updates.customerName;
      if (updates.customerPhone) payload.customer_phone = updates.customerPhone;
      const { error } = await client.from('bookings').update(payload).or(`id.eq.${id},booking_code.eq.${id}`);
      return !error;
    } catch {
      return false;
    }
  }

  static async deleteBooking(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('bookings').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).or(`id.eq.${id},booking_code.eq.${id}`);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Transactions ---
  static async fetchTransactions(): Promise<Transaction[] | null> {
    const client = getServerSupabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('is_deleted', false);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data.map((t: any) => ({
        id: String(t.id),
        invoiceNumber: t.invoice_number || t.invoiceNumber || `TRX-${String(t.id).slice(-4)}`,
        bookingId: t.booking_id ? String(t.booking_id) : undefined,
        customerName: t.customer_name || t.customerName || 'Pelanggan',
        customerPhone: t.customer_phone || t.customerPhone || undefined,
        barberId: String(t.barber_id || t.barberId || 'barber-1'),
        barberName: t.barber_name || t.barberName || 'Staff Barber',
        items: Array.isArray(t.items) ? t.items : [],
        subtotal: Number(t.subtotal ?? t.total_amount ?? 0),
        discount: Number(t.discount ?? 0),
        totalAmount: Number(t.total_amount ?? 0),
        paymentMethod: t.payment_method || t.paymentMethod || 'cash',
        amountPaid: Number(t.amount_paid ?? t.total_amount ?? 0),
        changeAmount: Number(t.change_amount ?? 0),
        notes: t.notes || undefined,
        createdAt: t.created_at || t.createdAt || new Date().toISOString(),
      }));
    } catch {
      return null;
    }
  }

  static async insertTransaction(trx: Transaction): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;

    try {
      const { error } = await client.rpc('fn_create_pos_transaction', {
        p_invoice_number: trx.invoiceNumber,
        p_booking_id: trx.bookingId && trx.bookingId.length > 20 ? trx.bookingId : null,
        p_customer_name: trx.customerName,
        p_customer_phone: trx.customerPhone || null,
        p_barber_id: trx.barberId && trx.barberId.length > 20 ? trx.barberId : null,
        p_barber_name: trx.barberName,
        p_items: trx.items,
        p_subtotal: trx.subtotal,
        p_discount: trx.discount,
        p_total_amount: trx.totalAmount,
        p_payment_method: trx.paymentMethod,
        p_amount_paid: trx.amountPaid,
        p_change_amount: trx.changeAmount,
        p_notes: trx.notes || null,
      });

      if (error) {
        const { error: insertErr } = await client.from('transactions').insert({
          invoice_number: trx.invoiceNumber,
          customer_name: trx.customerName,
          customer_phone: trx.customerPhone || null,
          barber_name: trx.barberName,
          items: trx.items,
          subtotal: trx.subtotal,
          discount: trx.discount,
          total_amount: trx.totalAmount,
          payment_method: trx.paymentMethod,
          payment_status: 'paid',
          amount_paid: trx.amountPaid,
          change_amount: trx.changeAmount,
          notes: trx.notes || null,
        });
        return !insertErr;
      }

      return true;
    } catch {
      return false;
    }
  }

  static async deleteTransaction(id: string): Promise<boolean> {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('transactions').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
}


