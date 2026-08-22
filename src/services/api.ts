import { settingsService } from './settingsService';
import { servicesService } from './servicesService';
import { barbersService } from './barbersService';
import { bookingsService } from './bookingsService';
import { transactionsService } from './transactionsService';
import { aiService } from './aiService';
import { blueprintService } from './blueprintService';
import { STORAGE_KEYS } from './storage';

export {
  STORAGE_KEYS,
  settingsService,
  servicesService,
  barbersService,
  bookingsService,
  transactionsService,
  aiService,
  blueprintService,
};

/**
 * Unified API facade for seamless backwards-compatibility
 */
export const api = {
  // Settings
  getSettings: settingsService.getSettings,
  updateSettings: settingsService.updateSettings,
  toggleBookingSwitch: settingsService.toggleBookingSwitch,

  // Services
  getServices: servicesService.getServices,
  createService: servicesService.createService,
  updateService: servicesService.updateService,
  deleteService: servicesService.deleteService,

  // Barbers
  getBarbers: barbersService.getBarbers,
  createBarber: barbersService.createBarber,
  updateBarber: barbersService.updateBarber,
  deleteBarber: barbersService.deleteBarber,

  // Bookings
  getBookings: bookingsService.getBookings,
  createBooking: bookingsService.createBooking,
  updateBooking: bookingsService.updateBooking,
  deleteBooking: bookingsService.deleteBooking,
  trackBooking: bookingsService.trackBooking,

  // Transactions (POS)
  getTransactions: transactionsService.getTransactions,
  createTransaction: transactionsService.createTransaction,
  deleteTransaction: transactionsService.deleteTransaction,

  // AI Barber Consultant
  getAIConsultation: aiService.getAIConsultation,

  // Blueprints & Database
  getDatabaseStatus: blueprintService.getDatabaseStatus,
  getDatabaseSchema: blueprintService.getDatabaseSchema,
  getSitemap: blueprintService.getSitemap,
};
