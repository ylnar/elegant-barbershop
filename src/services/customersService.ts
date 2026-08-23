import { getSupabaseClient } from './supabaseClient';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalBookings: number;
  lastBookingDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Normalisasi nomor HP: hanya angka, untuk perbandingan yang konsisten */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Lookup customer by phone number.
 * Returns customer data if found, null if not found.
 * Handles any phone format variations (08xx, 628xx, +628xx, etc.)
 */
export async function lookupCustomerByPhone(phone: string): Promise<Customer | null> {
  const client = getSupabaseClient();
  if (!client || !phone || phone.trim().length === 0) return null;

  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return null;

  try {
    // Use RPC for phone-normalized lookup
    const { data, error } = await client.rpc('fn_lookup_customer_by_phone', {
      p_phone: phone,
    });

    if (error) {
      console.warn('[Customer Lookup RPC Error]:', error.message);
      // Fallback: direct query with phone normalization
      return await lookupByDirectQuery(normalized);
    }

    if (data && typeof data === 'object' && data.found === true && data.customer) {
      return mapCustomer(data.customer);
    }
    return null;
  } catch (err: any) {
    console.warn('[Customer Lookup Error]:', err.message);
    // Fallback: direct query
    return await lookupByDirectQuery(normalized);
  }
}

/** Fallback: direct Supabase query when RPC fails */
async function lookupByDirectQuery(normalizedPhone: string): Promise<Customer | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Paginated approach: fetch in batches until found or exhausted
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) break;

      const match = data.find((c: any) => normalizePhone(c.phone) === normalizedPhone);
      if (match) return mapCustomer(match);

      hasMore = data.length === pageSize;
      page++;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Upsert customer: create if not exists, update booking count if exists.
 * Called automatically when a new booking is created.
 */
export async function upsertCustomer(
  name: string,
  phone: string,
  email?: string
): Promise<{ customer: Customer; isNew: boolean } | null> {
  const client = getSupabaseClient();
  if (!client || !phone || phone.trim().length === 0) return null;

  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return null;

  try {
    const { data, error } = await client.rpc('fn_upsert_customer', {
      p_name: name,
      p_phone: phone,
      p_email: email || null,
    });

    if (error) {
      console.warn('[Customer Upsert RPC Error]:', error.message);
      // Fallback: direct upsert
      return await upsertDirect(name, phone, email);
    }

    if (data && typeof data === 'object' && data.customer && typeof data.is_new === 'boolean') {
      return {
        customer: mapCustomer(data.customer),
        isNew: data.is_new,
      };
    }
    return null;
  } catch (err: any) {
    console.warn('[Customer Upsert Error]:', err.message);
    // Fallback: direct upsert
    return await upsertDirect(name, phone, email);
  }
}

/** Fallback: direct Supabase upsert when RPC fails */
async function upsertDirect(
  name: string,
  phone: string,
  email?: string
): Promise<{ customer: Customer; isNew: boolean } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const normalized = normalizePhone(phone);
    const today = new Date().toISOString().split('T')[0];

    // Paginated search for existing customer
    let page = 0;
    const pageSize = 100;
    let hasMore = true;
    let match: any = null;

    while (hasMore && !match) {
      const { data, error } = await client
        .from('customers')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) break;

      match = data.find((c: any) => normalizePhone(c.phone) === normalized);
      hasMore = data.length === pageSize;
      page++;
    }

    if (match) {
      // Update existing
      const { data, error } = await client
        .from('customers')
        .update({
          name: (name && name.trim()) || match.name,
          email: (email && email.trim()) || match.email,
          total_bookings: (match.total_bookings || 0) + 1,
          last_booking_date: today,
        })
        .eq('id', match.id)
        .select()
        .single();

      if (error) throw error;
      return { customer: mapCustomer(data), isNew: false };
    } else {
      // Insert new
      const { data, error } = await client
        .from('customers')
        .insert({
          name: name,
          phone: phone,
          email: email || null,
          total_bookings: 1,
          last_booking_date: today,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { customer: mapCustomer(data), isNew: true };
    }
  } catch (err: any) {
    console.warn('[Customer Upsert Direct Error]:', err.message);
    return null;
  }
}

/** Map DB row to Customer type */
function mapCustomer(row: any): Customer {
  return {
    id: String(row.id || ''),
    name: row.name || 'Pelanggan',
    phone: row.phone || '',
    email: row.email || undefined,
    totalBookings: Number(row.total_bookings || 0),
    lastBookingDate: row.last_booking_date || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch all active customers (for admin display)
 */
export async function fetchCustomers(): Promise<Customer[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('total_bookings', { ascending: false });

    if (error || !data) return [];
    return data.map(mapCustomer);
  } catch {
    return [];
  }
}
