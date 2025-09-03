'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface StatsCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalIncome,
  totalExpenses,
  balance,
}) => {
  const cards = [
    {
      title: "Total Income",
      value: totalIncome,
      icon: TrendingUp,
      subtitle: "This month",
      color: "green"
    },
    {
      title: "Total Expenses", 
      value: totalExpenses,
      icon: TrendingDown,
      subtitle: "This month",
      color: "red"
    },
    {
      title: "Balance",
      value: balance,
      icon: DollarSign,
      subtitle: "Remaining this month",
      color: balance >= 0 ? "blue" : "orange"
    }
  ];

  return (
    <div className="mb-6 sm:mb-8">
      {/* Desktop: Centered grid layout */}
      <div className="hidden md:flex justify-center">
        <div className="grid grid-cols-3 gap-3 w-full">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const colorClasses = {
              green: {
                bg: 'from-green-50 border-green-200',
                title: 'text-green-800',
                icon: 'text-green-600',
                value: 'text-green-900',
                subtitle: 'text-green-700'
              },
              red: {
                bg: 'from-red-50 border-red-200',
                title: 'text-red-800',
                icon: 'text-red-600',
                value: 'text-red-900',
                subtitle: 'text-red-700'
              },
              blue: {
                bg: 'from-blue-50 border-blue-200',
                title: 'text-blue-800',
                icon: 'text-blue-600',
                value: 'text-blue-900',
                subtitle: 'text-blue-700'
              },
              orange: {
                bg: 'from-orange-50 border-orange-200',
                title: 'text-orange-800',
                icon: 'text-orange-600',
                value: 'text-orange-900',
                subtitle: 'text-orange-700'
              }
            };

            const colors = colorClasses[card.color as keyof typeof colorClasses];

            return (
              <Card 
                key={index}
                className={`bg-gradient-to-br ${colors.bg} w-full`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                  <CardTitle className={`text-sm font-medium ${colors.title}`}>
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${colors.icon}`} />
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className={`text-2xl font-bold ${colors.value}`}>
                    {formatCurrency(card.value)}
                  </div>
                  <p className={`text-xs mt-1 ${colors.subtitle}`}>
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mobile: Swiper carousel */}
      <div className="md:hidden">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={8}
          slidesPerView={2.2}
          centeredSlides={false}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          className="stats-swiper"
        >
          {cards.map((card, index) => {
            const Icon = card.icon;
            const colorClasses = {
              green: {
                bg: 'from-green-50 border-green-200',
                title: 'text-green-800',
                icon: 'text-green-600',
                value: 'text-green-900',
                subtitle: 'text-green-700'
              },
              red: {
                bg: 'from-red-50 border-red-200',
                title: 'text-red-800',
                icon: 'text-red-600',
                value: 'text-red-900',
                subtitle: 'text-red-700'
              },
              blue: {
                bg: 'from-blue-50 border-blue-200',
                title: 'text-blue-800',
                icon: 'text-blue-600',
                value: 'text-blue-900',
                subtitle: 'text-blue-700'
              },
              orange: {
                bg: 'from-orange-50 border-orange-200',
                title: 'text-orange-800',
                icon: 'text-orange-600',
                value: 'text-orange-900',
                subtitle: 'text-orange-700'
              }
            };

            const colors = colorClasses[card.color as keyof typeof colorClasses];

            return (
              <SwiperSlide key={index}>
                <Card 
                  className={`bg-gradient-to-br ${colors.bg} h-full`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className={`text-sm font-medium ${colors.title}`}>
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${colors.icon}`} />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className={`text-xl sm:text-2xl font-bold ${colors.value}`}>
                      {formatCurrency(card.value)}
                    </div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <style jsx global>{`
          .stats-swiper .swiper-pagination {
            bottom: -30px !important;
          }
          
          .stats-swiper .swiper-pagination-bullet {
            background: #d1d5db;
            opacity: 1;
          }
          
          .stats-swiper .swiper-pagination-bullet-active {
            background: #6366f1;
          }
        `}</style>
      </div>
    </div>
  );
};