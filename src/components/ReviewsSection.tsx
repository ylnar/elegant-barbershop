import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { INITIAL_REVIEWS } from '../data/initialData';

export const ReviewsSection: React.FC = () => {
  const reviews = INITIAL_REVIEWS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Determine items per page based on window size
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2); // Tablet: 2 cards
      } else {
        setItemsPerPage(3); // Desktop: 3 cards
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(reviews.length / itemsPerPage);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  };

  // Autoplay
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, totalPages]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 45) {
      // Swiped left -> next
      nextSlide();
    } else if (diff < -45) {
      // Swiped right -> prev
      prevSlide();
    }
    touchStartX.current = null;
  };

  const visibleReviews = reviews.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  );

  return (
    <section
      id="reviews"
      className="py-16 bg-[#0A0A0E] border-t border-[#1C1C26] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Rating Badge & Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1910] border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>4.9 / 5.0 Rating Pelanggan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Ulasan Pelanggan
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              Pengalaman pangkas rambut di Elegant Barbershop Solok.
            </p>
          </div>

          {/* Slider Arrows Navigation */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Ulasan Sebelumnya"
              className="w-9 h-9 rounded-full bg-[#14141C] hover:bg-[#1D1D28] border border-stone-800 hover:border-[#D4AF37]/50 text-stone-300 hover:text-[#D4AF37] flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Ulasan Selanjutnya"
              className="w-9 h-9 rounded-full bg-[#14141C] hover:bg-[#1D1D28] border border-stone-800 hover:border-[#D4AF37]/50 text-stone-300 hover:text-[#D4AF37] flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Content */}
        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-300 ease-in-out">
            {visibleReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#121218] border border-stone-800/90 hover:border-[#D4AF37]/40 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-lg relative group"
              >
                {/* Decorative Quote Mark */}
                <Quote className="w-8 h-8 text-[#D4AF37]/10 absolute top-4 right-4 group-hover:text-[#D4AF37]/20 transition-colors" />

                <div>
                  {/* Rating & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500">{rev.date}</span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6 font-normal">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Customer Info & Barber Tag */}
                <div className="pt-3.5 border-t border-stone-800/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                      {rev.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {rev.customerName}
                        </span>
                        {rev.verified && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      {rev.barberName && (
                        <span className="text-[10px] text-stone-400 block truncate">
                          Barber: <span className="text-stone-300">{rev.barberName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {rev.serviceName && (
                    <span className="px-2 py-0.5 rounded-md bg-[#1C1C28] text-[10px] font-medium text-[#D4AF37] border border-stone-700/60 shrink-0">
                      {rev.serviceName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 bg-[#D4AF37]'
                  : 'w-1.5 bg-stone-700 hover:bg-stone-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
