import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Booking } from './types';
import { useBarbershopData } from './hooks/useBarbershopData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { BookingSection } from './components/BookingSection';
import { ReviewsSection } from './components/ReviewsSection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';

import { BookingTicketModal } from './components/BookingTicketModal';
import { ToastContainer } from './components/ui/Toast';
import { AdminLoginModal, getStoredSession, clearStoredSession, verifySession } from './components/admin/AdminLoginModal';

// Lazy load heavy admin components for better initial load performance
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DatabaseBlueprintModal = lazy(() => import('./components/admin/DatabaseBlueprintModal').then(m => ({ default: m.DatabaseBlueprintModal })));

interface AppProps {
  dashboardOnly?: boolean;
}

export default function App({ dashboardOnly = false }: AppProps) {
  const {
    settings,
    services,
    barbers,
    bookings,
    transactions,
    refreshData,
    addBooking,
  } = useBarbershopData();

  // Modals & triggers
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<string | null>(null);
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState<boolean>(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; displayName: string; role: string } | null>(() => getStoredSession());
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  // Auto-verify stored session on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored && !adminDashboardOpen) {
      verifySession(stored.id).then((validUser) => {
        if (validUser) {
          setCurrentUser(validUser);
          setAdminDashboardOpen(true);
        } else {
          clearStoredSession();
          setCurrentUser(null);
        }
        setSessionChecked(true);
      }).catch(() => {
        setSessionChecked(true);
      });
    } else {
      setSessionChecked(true);
    }
  }, []);

  // Smooth scroll to booking section
  const handleScrollToBooking = () => {
    const bookingEl = document.getElementById('booking');
    if (bookingEl) {
      bookingEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectServiceAndBook = (serviceId: string) => {
    setSelectedServiceForBooking(serviceId);
    handleScrollToBooking();
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setTicketModalBooking(newBooking);
    addBooking(newBooking);
  };

  const handleOpenAdmin = () => {
    window.location.assign('/dashboard');
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0A0A0E] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (dashboardOnly) {
    return (
      <div className="min-h-screen bg-[#0A0A0E] text-stone-100">
        <ToastContainer />
        {adminDashboardOpen && currentUser ? (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <AdminDashboard
              settings={settings}
              services={services}
              barbers={barbers}
              bookings={bookings}
              transactions={transactions}
              currentUser={currentUser}
              onRefreshData={refreshData}
              onClose={() => {
                clearStoredSession();
                window.location.assign('/');
              }}
            />
          </Suspense>
        ) : (
          <AdminLoginModal
            onSuccess={(user) => {
              setCurrentUser(user);
              setAdminLoginModalOpen(false);
              setAdminDashboardOpen(true);
            }}
            onClose={() => window.location.assign('/')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-stone-100 font-sans selection:bg-[#D4AF37] selection:text-stone-950">
      <ToastContainer />
      {/* 1. Header / Navbar */}
      <Navbar
        settings={settings}
        onOpenBooking={handleScrollToBooking}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* 2. Hero Section */}
      <main id="main-content">
        <HeroSection
          settings={settings}
          onOpenBooking={handleScrollToBooking}
        />

        {/* 3. Services & Menu */}
        <ServicesSection
          services={services}
          settings={settings}
          onSelectServiceAndBook={handleSelectServiceAndBook}
        />


        {/* 5. Dynamic Booking Engine (Reactive to Master Switch) */}
        <BookingSection
          settings={settings}
          services={services}
          barbers={barbers}
          bookings={bookings}
          selectedServiceId={selectedServiceForBooking}
          onSelectServiceId={setSelectedServiceForBooking}
          onBookingSuccess={handleBookingSuccess}
          onTrackTicket={(booking) => setTicketModalBooking(booking)}
        />

        {/* 6. Reviews & Ratings */}
        <ReviewsSection />

        {/* 7. Location & Operating Hours */}
        <LocationSection settings={settings} />
      </main>

      {/* 8. Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
        onOpenSchemaModal={() => setSchemaModalOpen(true)}
      />

      {/* --- MODALS --- */}

      {/* Booking Ticket Confirmation Modal */}
      {ticketModalBooking && (
        <BookingTicketModal
          booking={ticketModalBooking}
          settings={settings}
          onClose={() => setTicketModalBooking(null)}
        />
      )}

      {/* Admin Login Modal */}
      {adminLoginModalOpen && (
        <AdminLoginModal
          onSuccess={(user) => {
            setCurrentUser(user);
            setAdminLoginModalOpen(false);
            setAdminDashboardOpen(true);
          }}
          onClose={() => setAdminLoginModalOpen(false)}
        />
      )}

      {/* Admin Operational Dashboard (Lazy Loaded) */}
      {adminDashboardOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <AdminDashboard
            settings={settings}
            services={services}
            barbers={barbers}
            bookings={bookings}
            transactions={transactions}
            currentUser={currentUser}
            onRefreshData={refreshData}
            onClose={() => {
              setAdminDashboardOpen(false);
              setCurrentUser(null);
              clearStoredSession();
            }}
          />
        </Suspense>
      )}

      {/* Database Blueprint & Sitemap Modal (Lazy Loaded) */}
      {schemaModalOpen && (
        <Suspense fallback={null}>
          <DatabaseBlueprintModal onClose={() => setSchemaModalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
