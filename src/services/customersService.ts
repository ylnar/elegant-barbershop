import { lookupCustomerByPhone, upsertCustomer, fetchCustomers, dbUpdateCustomer, dbDeleteCustomer } from './dbClient';
import type { Customer } from './dbClient';

export { lookupCustomerByPhone, upsertCustomer, fetchCustomers, dbUpdateCustomer, dbDeleteCustomer };
export type { Customer } from './dbClient';

export const updateCustomer = async (
  id: string,
  updates: { name?: string; email?: string; phone?: string; isActive?: boolean },
): Promise<Customer> => dbUpdateCustomer(id, updates);

/**
 * Hapus data pelanggan. HTTP 404 dianggap "sudah tidak ada" sehingga operasi
 * tetap sukses dan daftar dapat di-refresh dari server.
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    return await dbDeleteCustomer(id);
  } catch (err: any) {
    if (err?.status === 404) return true;
    throw err;
  }
};