import { Service } from '../types';
import { INITIAL_SERVICES } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchServicesLive, dbCreateService, dbUpdateService, dbDeleteService } from './dbClient';

export const servicesService = {
  async getServices(): Promise<Service[]> {
    // 1. Ambil dari server (MongoDB via API routes)
    try {
      const liveServices = await fetchServicesLive();
      if (liveServices !== null) {
        setLocal(STORAGE_KEYS.SERVICES, liveServices);
        return liveServices;
      }
    } catch {
      // Aksi lanjut ke cache lokal
    }

    return getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  async createService(serviceData: Omit<Service, 'id'>): Promise<Service> {
    const created = await dbCreateService({
      name: serviceData.name,
      category: serviceData.category,
      price: serviceData.price,
      durationMinutes: serviceData.durationMinutes,
      description: serviceData.description,
      badge: serviceData.badge,
      isActive: serviceData.isActive,
    });

    const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    list.push(created);
    setLocal(STORAGE_KEYS.SERVICES, list);
    return created;
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    const updated = await dbUpdateService(id, updates);

    const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const idx = list.findIndex((s) => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated };
    } else {
      list.push(updated);
    }
    setLocal(STORAGE_KEYS.SERVICES, list);
    return updated;
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      await dbDeleteService(id);
    } catch (e: any) {
      // 404 = sudah tidak ada di server → anggap berhasil agar cache lokal ikut bersih
      if (e?.status !== 404) throw e;
    }

    const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES).filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.SERVICES, list);
    return true;
  },
};