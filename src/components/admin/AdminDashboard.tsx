import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Radio,
  Scissors,
  TrendingUp,
  Users,
  BookOpen,
  LogOut,
  Menu,
  X,
  Clock,
  CreditCard,
  CalendarCheck,
} from 'lucide-react';
import { Booking, Service, Barber, SystemSettings, Transaction, PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { MasterSwitchTab } from './tabs/MasterSwitchTab';
import { getLocalTodayStr } from '../../utils/formatters';
import { TransactionsTab } from './tabs/TransactionsTab';
import { BookingsTab } from './tabs/BookingsTab';
import { ServicesTab } from './tabs/ServicesTab';
import { BarbersTab } from './tabs/BarbersTab';
import { ReportsTab } from './tabs/ReportsTab';
import { AdminGuideTab } from './tabs/AdminGuideTab';
import { ServiceFormModal } from './modals/ServiceFormModal';
import { BarberFormModal } from './modals/BarberFormModal';
import { WalkInFormModal } from './modals/WalkInFormModal';
import { AdminBookingModal } from './modals/AdminBookingModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { CompletionPaymentModal } from './modals/CompletionPaymentModal';
import { toast } from '../ui/Toast';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AdminDashboardProps {
  settings: SystemSettings;
  services: Service[];
  barbers: Barber[];
  bookings: Booking[];
  transactions: Transaction[];
  currentUser?: AdminUser | null;
  onRefreshData: () => Promise<void>;
  onClose: () => void;
  /** Bila ada, tombol "Keluar" benar-benar menghapus sesi (logout). */
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  services,
  barbers,
  bookings,
  transactions,
  currentUser,
  onRefreshData,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'transactions' | 'bookings' | 'switch' | 'services' | 'barbers' | 'reports' | 'guide'
  >('transactions');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [adminBookingModalOpen, setAdminBookingModalOpen] = useState<boolean>(false);
  const [serviceModalOpen, setServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [barberModalOpen, setBarberModalOpen] = useState<boolean>(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [walkInModalOpen, setWalkInModalOpen] = useState<boolean>(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Delete Confirmation States
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeletingService, setIsDeletingService] = useState<boolean>(false);

  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [isDeletingBarber, setIsDeletingBarber] = useState<boolean>(false);

  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);

  // Booking Deletion States (single & bulk history purge)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState<boolean>(false);
  const [clearHistoryOpen, setClearHistoryOpen] = useState<boolean>(false);
  const [isPurgingHistory, setIsPurgingHistory] = useState<boolean>(false);

  // Completion Payment Modal State
  const [completionBooking, setCompletionBooking] = useState<Booking | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState<boolean>(false);

  // Kunci scroll halaman luar (body) saat Dashboard Admin terbuka
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Master Switch Action
  const handleToggleMasterSwitch = async () => {
    try {
      const result = await api.toggleBookingSwitch();
      setSwitchFeedback(result.message);
      await onRefreshData();
      setTimeout(() => setSwitchFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error toggling master switch:', err);
      toast.error(
        err?.message ||
          'Gagal mengubah status booking. Periksa koneksi ke server/database lalu coba lagi.',
      );
    }
  };

  // Service CRUD
  const handleOpenServiceModal = (srv?: Service) => {
    setEditingService(srv || null);
    setServiceModalOpen(true);
  };

  const handleSaveService = async (serviceData: any) => {
    try {
      if (editingService) {
        await api.updateService(editingService.id, serviceData);
        toast.success('Layanan berhasil diperbarui!');
      } else {
        await api.createService(serviceData);
        toast.success('Layanan baru berhasil ditambahkan!');
      }
      await onRefreshData();
    } catch {
      toast.error('Gagal menyimpan layanan. Coba lagi.');
    }
  };

  const handlePromptDeleteService = (id: string) => {
    const srv = services.find((s) => s.id === id);
    if (srv) setServiceToDelete(srv);
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);
    try {
      await api.deleteService(serviceToDelete.id);
      await onRefreshData();
      setServiceToDelete(null);
      toast.success(`Layanan "${serviceToDelete.name}" berhasil dihapus.`);
    } catch {
      toast.error('Gagal menghapus layanan. Coba lagi.');
    } finally {
      setIsDeletingService(false);
    }
  };

  // Barber CRUD
  const handleOpenBarberModal = (b?: Barber) => {
    setEditingBarber(b || null);
    setBarberModalOpen(true);
  };

  const handleSaveBarber = async (barberData: any) => {
    try {
      if (editingBarber) {
        await api.updateBarber(editingBarber.id, barberData);
        toast.success('Data barber berhasil diperbarui!');
      } else {
        await api.createBarber({
          ...barberData,
          workingDays: [0, 1, 2, 3, 4, 5, 6],
        });
        toast.success('Barber baru berhasil ditambahkan!');
      }
      await onRefreshData();
    } catch {
      toast.error('Gagal menyimpan data barber. Coba lagi.');
    }
  };

  const handlePromptDeleteBarber = (id: string) => {
    const b = barbers.find((item) => item.id === id);
    if (b) setBarberToDelete(b);
  };

  const handleConfirmDeleteBarber = async () => {
    if (!barberToDelete) return;
    setIsDeletingBarber(true);
    try {
      await api.deleteBarber(barberToDelete.id);
      await onRefreshData();
      setBarberToDelete(null);
      toast.success(`Barber "${barberToDelete.name}" berhasil dihapus.`);
    } catch {
      toast.error('Gagal menghapus barber. Coba lagi.');
    } finally {
      setIsDeletingBarber(false);
    }
  };

  // Walk-in creation
  const handleSaveWalkIn = async (data: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    barberId: string;
  }) => {
    const now = new Date();
    const today = getLocalTodayStr();
    const currentHour = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    try {
      await api.createBooking({
        customerName: `[Walk-in] ${data.customerName}`,
        customerPhone: data.customerPhone,
        serviceId: data.serviceId,
        barberId: data.barberId,
        date: today,
        timeSlot: currentHour,
        isWalkIn: true,
      });

      await onRefreshData();
      toast.success(`Walk-in ${data.customerName} berhasil dicatat.`);
    } catch {
      toast.error('Gagal mencatat walk-in. Coba lagi.');
    }
  };

  // Admin manual booking creation
  const handleSaveAdminBooking = async (data: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    barberId: string;
    date: string;
    timeSlot: string;
  }) => {
    try {
      await api.createBooking({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        serviceId: data.serviceId,
        barberId: data.barberId === 'any' ? undefined : data.barberId,
        date: data.date,
        timeSlot: data.timeSlot,
        isWalkIn: false,
      });
      await onRefreshData();
      toast.success(`Reservasi untuk ${data.customerName} berhasil dibuat.`);
    } catch {
      toast.error('Gagal membuat reservasi. Coba lagi.');
    }
  };

  const handleBookingStatusChange = async (bookingId: string, status: Booking['status']) => {
    // When completing, show payment modal first
    if (status === 'completed') {
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        setCompletionBooking(booking);
        setCompletionModalOpen(true);
      }
      return;
    }

    // For other statuses (pending, confirmed, in_service, cancelled), update directly
    try {
      await api.updateBooking(bookingId, { status });
      await onRefreshData();
      toast.success(`Status reservasi berhasil diubah ke "${status}".`);
    } catch {
      toast.error('Gagal mengubah status reservasi. Coba lagi.');
    }
  };

  // Called after user confirms payment in CompletionPaymentModal
  const handleConfirmCompletion = async (paymentMethod: PaymentMethod, amountPaid: number) => {
    if (!completionBooking) return;

    // 1. Update booking status to completed
    await api.updateBooking(completionBooking.id, { status: 'completed' });

    // 2. Create transaction with selected payment details
    const changeAmount = Math.max(0, amountPaid - completionBooking.totalAmount);
    try {
      await api.createTransaction({
        customerName: completionBooking.customerName,
        customerPhone: completionBooking.customerPhone,
        barberId: completionBooking.barberId,
        items: [{
          serviceId: completionBooking.serviceId,
          serviceName: completionBooking.serviceName,
          price: completionBooking.servicePrice,
          qty: 1,
        }],
        subtotal: completionBooking.totalAmount,
        discount: 0,
        totalAmount: completionBooking.totalAmount,
        paymentMethod,
        amountPaid,
        changeAmount,
        notes: `Auto dari reservasi ${completionBooking.bookingCode}`,
      });
      toast.success(`Reservasi ${completionBooking.bookingCode} selesai! Transaksi berhasil dibuat.`);
    } catch {
      toast.error('Gagal membuat transaksi. Status booking tetap diupdate ke Selesai.');
    }

    setCompletionBooking(null);
    await onRefreshData();
  };

  // Delete single booking (dengan konfirmasi via ConfirmModal)
  const handleConfirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setIsDeletingBooking(true);
    try {
      await api.deleteBooking(bookingToDelete.id);
      await onRefreshData();
      toast.success(`Reservasi ${bookingToDelete.bookingCode} berhasil dihapus.`);
      setBookingToDelete(null);
    } catch {
      toast.error('Gagal menghapus reservasi. Coba lagi.');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Purge semua riwayat (completed + cancelled)
  const archivedBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  const handleConfirmClearHistory = async () => {
    if (archivedBookings.length === 0) {
      setClearHistoryOpen(false);
      return;
    }
    setIsPurgingHistory(true);
    let success = 0;
    let failed = 0;
    for (const b of archivedBookings) {
      try {
        await api.deleteBooking(b.id);
        success += 1;
      } catch {
        failed += 1;
      }
    }
    await onRefreshData();
    setIsPurgingHistory(false);
    setClearHistoryOpen(false);
    if (failed > 0) {
      toast.error(`${success} riwayat terhapus, ${failed} gagal dihapus.`);
    } else {
      toast.success(`${success} data riwayat reservasi berhasil dibersihkan.`);
    }
  };

  type TabId =
    | 'transactions'
    | 'bookings'
    | 'switch'
    | 'services'
    | 'barbers'
    | 'reports'
    | 'guide';

  const navGroups: { label: string; items: { id: TabId; label: string; icon: typeof CreditCard; badge?: string; badgeColor?: string }[] }[] = [
    {
      label: 'Operasional Harian',
      items: [
        {
          id: 'transactions',
          label: 'Kasir & Transaksi',
          icon: CreditCard,
          badge: transactions.length > 0 ? `${transactions.length}` : undefined,
          badgeColor: 'bg-[#D4AF37]/20 text-[#D4AF37]',
        },
        {
          id: 'bookings',
          label: 'Reservasi Booking',
          icon: CalendarCheck,
          badge: `${bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length}`,
          badgeColor: 'bg-sky-500/20 text-sky-300',
        },
        {
          id: 'switch',
          label: 'Status Buka & Antrean',
          icon: Radio,
          badge: settings.isBookingOpen ? 'Buka' : 'Tutup',
          badgeColor: settings.isBookingOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400',
        },
      ],
    },
    {
      label: 'Pengelolaan Data',
      items: [
        {
          id: 'services',
          label: 'Layanan & Harga',
          icon: Scissors,
          badge: `${services.length}`,
          badgeColor: 'bg-stone-800 text-stone-300',
        },
        {
          id: 'barbers',
          label: 'Data Barber',
          icon: Users,
          badge: `${barbers.length}`,
          badgeColor: 'bg-stone-800 text-stone-300',
        },
      ],
    },
    {
      label: 'Laporan & Info',
      items: [
        {
          id: 'reports',
          label: 'Laporan Keuangan',
          icon: TrendingUp,
        },
        {
          id: 'guide',
          label: 'Petunjuk & Panduan',
          icon: BookOpen,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:flex-row bg-[#08080C] text-stone-200 overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ASIDE */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0E0E16] border-r border-[#1E1E2C] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div className="p-5 border-b border-[#1A1A26]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#997926] text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-[#D4AF37]/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white font-serif tracking-wide truncate">
                  ELEGANT BARBERSHOP
                </h1>
                <p className="text-[11px] text-[#D4AF37] font-medium truncate">
                  Panel Pengelola Solok
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white bg-stone-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Status Indicator */}
          <div className="mt-4 p-2.5 rounded-xl bg-[#141420] border border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.isBookingOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-xs text-stone-300 font-medium">
                {settings.isBookingOpen ? 'Reservasi Online Aktif' : 'Reservasi Ditutup'}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <span className="px-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1.5">
                {group.label}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-bold'
                          : 'text-stone-300 hover:bg-[#181824] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-stone-950' : 'text-[#D4AF37] group-hover:text-white'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-stone-950/20 text-stone-950'
                              : item.badgeColor || 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Aside Footer */}
        <div className="p-4 border-t border-[#1A1A26] bg-[#0A0A10] space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 text-[11px] text-stone-400 px-1">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Jam Operasi: 10:00 - 22:00</span>
          </div>

          <button
            onClick={() => setLogoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Tutup &amp; Kembali ke Web</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#08080C]">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 lg:px-8 border-b border-[#1A1A26] bg-[#0E0E16]/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#181824] border border-stone-800 text-stone-200 hover:text-white cursor-pointer shrink-0"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide truncate">
                {navGroups.flatMap((g) => g.items).find((n) => n.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A26] border border-stone-800">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#D4AF37]">
                    {currentUser.displayName?.charAt(0) || currentUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-semibold text-white leading-none">{currentUser.displayName || currentUser.username}</p>
                  <p className="text-[9px] text-stone-500 leading-none mt-0.5 capitalize">{currentUser.role}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setLogoutModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Panel</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'transactions' && (
              <TransactionsTab
                services={services}
                barbers={barbers}
                bookings={bookings}
                transactions={transactions}
                onRefreshData={onRefreshData}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingsTab
                bookings={bookings}
                barbers={barbers}
                archivedCount={archivedBookings.length}
                onStatusChange={handleBookingStatusChange}
                onOpenBookingModal={() => setAdminBookingModalOpen(true)}
                onOpenWalkInModal={() => setWalkInModalOpen(true)}
                onRefreshData={onRefreshData}
                onRequestDeleteBooking={(b) => setBookingToDelete(b)}
                onRequestClearHistory={() => setClearHistoryOpen(true)}
              />
            )}

            {activeTab === 'switch' && (
              <MasterSwitchTab
                settings={settings}
                switchFeedback={switchFeedback}
                onToggleMasterSwitch={handleToggleMasterSwitch}
              />
            )}

            {activeTab === 'services' && (
              <ServicesTab
                services={services}
                onOpenServiceModal={handleOpenServiceModal}
                onDeleteService={handlePromptDeleteService}
              />
            )}

            {activeTab === 'barbers' && (
              <BarbersTab
                barbers={barbers}
                onOpenBarberModal={handleOpenBarberModal}
                onDeleteBarber={handlePromptDeleteBarber}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                bookings={bookings}
                services={services}
                transactions={transactions}
              />
            )}

            {activeTab === 'guide' && <AdminGuideTab />}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ServiceFormModal
        isOpen={serviceModalOpen}
        editingService={editingService}
        onClose={() => setServiceModalOpen(false)}
        onSave={handleSaveService}
      />

      <BarberFormModal
        isOpen={barberModalOpen}
        editingBarber={editingBarber}
        onClose={() => setBarberModalOpen(false)}
        onSave={handleSaveBarber}
      />

      <WalkInFormModal
        isOpen={walkInModalOpen}
        services={services}
        barbers={barbers}
        onClose={() => setWalkInModalOpen(false)}
        onSave={handleSaveWalkIn}
      />

      <AdminBookingModal
        isOpen={adminBookingModalOpen}
        services={services}
        barbers={barbers}
        settings={settings}
        bookings={bookings}
        onClose={() => setAdminBookingModalOpen(false)}
        onSave={handleSaveAdminBooking}
      />

      {/* Delete Single Booking Confirmation */}
      <ConfirmModal
        isOpen={!!bookingToDelete}
        title="Hapus Data Reservasi"
        description={`Reservasi ${bookingToDelete?.bookingCode || ''} atas nama "${bookingToDelete?.customerName || ''}" akan dihapus permanen dari sistem. Lanjutkan?`}
        confirmText="Ya, Hapus Reservasi"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isDeletingBooking}
        onConfirm={handleConfirmDeleteBooking}
        onClose={() => setBookingToDelete(null)}
      />

      {/* Clear History Confirmation */}
      <ConfirmModal
        isOpen={clearHistoryOpen}
        title="Bersihkan Riwayat Reservasi"
        description={`Semua ${archivedBookings.length} reservasi berstatus Selesai/Dibatalkan akan dihapus. Transaksi & laporan keuangan tetap aman. Lanjutkan?`}
        confirmText={`Ya, Hapus ${archivedBookings.length} Riwayat`}
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isPurgingHistory}
        onConfirm={handleConfirmClearHistory}
        onClose={() => setClearHistoryOpen(false)}
      />

      {/* Delete Service Confirmation */}
      <ConfirmModal
        isOpen={!!serviceToDelete}
        title="Hapus Layanan dari Price List"
        description={`Apakah Anda yakin ingin menghapus layanan "${serviceToDelete?.name || ''}" seharga Rp ${serviceToDelete?.price?.toLocaleString('id-ID') || 0}?`}
        confirmText="Ya, Hapus Layanan"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isDeletingService}
        onConfirm={handleConfirmDeleteService}
        onClose={() => setServiceToDelete(null)}
      />

      {/* Delete Barber Confirmation */}
      <ConfirmModal
        isOpen={!!barberToDelete}
        title="Hapus Data Barber"
        description={`Apakah Anda yakin ingin menghapus data barber "${barberToDelete?.name || ''}"?`}
        confirmText="Ya, Hapus Barber"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isDeletingBarber}
        onConfirm={handleConfirmDeleteBarber}
        onClose={() => setBarberToDelete(null)}
      />

      {/* Completion Payment Modal */}
      <CompletionPaymentModal
        isOpen={completionModalOpen}
        booking={completionBooking}
        onClose={() => {
          setCompletionModalOpen(false);
          setCompletionBooking(null);
        }}
        onConfirm={handleConfirmCompletion}
      />

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Keluar dari Panel Pengelola"
        description="Apakah Anda yakin ingin menutup dashboard kasir/admin dan kembali ke tampilan website pengunjung?"
        confirmText="Ya, Keluar"
        cancelText="Tetap di Sini"
        variant="warning"
        icon="logout"
        onConfirm={() => {
          setLogoutModalOpen(false);
          onLogout ? onLogout() : onClose();
        }}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};
