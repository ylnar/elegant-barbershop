export type ServiceCategory = 'haircut' | 'shave' | 'treatment' | 'beard' | 'package';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number; // in IDR (Rupiah)
  durationMinutes: number;
  description: string;
  badge?: string;
  isActive: boolean;
}

export interface Barber {
  id: string;
  name: string;
  phone?: string; // WhatsApp number for barber notifications
  isActive: boolean;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_service' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface TransactionItem {
  serviceId: string;
  serviceName: string;
  price: number;
  qty: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string; // e.g. TRX-2024-001
  bookingId?: string;
  customerName: string;
  customerPhone?: string;
  barberId: string;
  barberName: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
  createdAt: string; // ISO date string
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. ELG-4921
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  addOnServices?: string[]; // IDs or names
  barberId: string; // 'any' or barber id
  barberName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  totalAmount: number;
  status: BookingStatus;
  isWalkIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  isBookingOpen: boolean; // Master switch
  walkInOnlyMessage: string;
  maintenanceMessage: string;
  currentWalkInQueue: number;
  estimatedWalkInWaitMinutes: number;
  shopName: string;
  tagline: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  instagramHandle: string;
  openTime: string; // e.g. "09:00"
  closeTime: string; // e.g. "21:00"
  slotIntervalMinutes: number; // e.g. 45 or 60
  maxSimultaneousBookingsPerSlot: number;
  currency: string;
}

export interface LookbookItem {
  id: string;
  title: string;
  category: string;
  faceShape: string[];
  hairType: string;
  description: string;
  imageUrl: string;
  recommendedServiceId: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
  barberName: string;
  serviceName: string;
  verified: boolean;
}

export interface AIConsultationRequest {
  faceShape: string;
  hairTexture: string;
  lifestyle: string;
  desiredLength: string;
  beardPreference: string;
  notes?: string;
}

export interface AIConsultationResponse {
  recommendedStyleName: string;
  reasoning: string;
  stylingTips: string[];
  recommendedProduct: string;
  recommendedService: string;
  maintenanceSchedule: string;
  isAiPowered?: boolean;
  source?: string;
}

export interface SchemaTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignRef?: string;
  nullable: boolean;
  defaultVal?: string;
  description: string;
}

export interface SchemaTable {
  tableName: string;
  description: string;
  columns: SchemaTableColumn[];
  indexes: string[];
}

export interface SitemapNode {
  title: string;
  path: string;
  role: 'Public / Customer' | 'Admin & Staff' | 'System API';
  description: string;
  subPages?: SitemapNode[];
}
