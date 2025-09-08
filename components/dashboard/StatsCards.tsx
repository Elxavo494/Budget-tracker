'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
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
  const { formatCurrency } = useCurrency();
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
    <div className="mb-8 sm:mb-8">
      {/* Desktop: Centered grid layout */}
      <div className="hidden md:flex justify-center">
        <div className="grid grid-cols-3 gap-3 w-full">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const colorClasses = {
              green: {
                border: 'border-green-200 dark:border-green-800/50',
                title: 'text-green-800 dark:text-green-200',
                icon: 'text-green-600 dark:text-green-400',
                value: 'text-green-900 dark:text-green-100',
                subtitle: 'text-green-700 dark:text-green-300'
              },
              red: {
                border: 'border-red-200 dark:border-red-800/50',
                title: 'text-red-800 dark:text-red-200',
                icon: 'text-red-600 dark:text-red-400',
                value: 'text-red-900 dark:text-red-100',
                subtitle: 'text-red-700 dark:text-red-300'
              },
              blue: {
                border: 'border-blue-200 dark:border-blue-800/50',
                title: 'text-blue-800 dark:text-blue-200',
                icon: 'text-blue-600 dark:text-blue-400',
                value: 'text-blue-900 dark:text-blue-100',
                subtitle: 'text-blue-700 dark:text-blue-300'
              },
              orange: {
                border: 'border-orange-200 dark:border-orange-800/50',
                title: 'text-orange-800 dark:text-orange-200',
                icon: 'text-orange-600 dark:text-orange-400',
                value: 'text-orange-900 dark:text-orange-100',
                subtitle: 'text-orange-700 dark:text-orange-300'
              }
            };

            const colors = colorClasses[card.color as keyof typeof colorClasses];

            return (
              <Card 
                key={index}
                className={`glass-card ${colors.border} w-full`}
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
                border: 'border-green-200 dark:border-green-800/50',
                title: 'text-green-800 dark:text-green-200',
                icon: 'text-green-600 dark:text-green-400',
                value: 'text-green-900 dark:text-green-100',
                subtitle: 'text-green-700 dark:text-green-300'
              },
              red: {
                border: 'border-red-200 dark:border-red-800/50',
                title: 'text-red-800 dark:text-red-200',
                icon: 'text-red-600 dark:text-red-400',
                value: 'text-red-900 dark:text-red-100',
                subtitle: 'text-red-700 dark:text-red-300'
              },
              blue: {
                border: 'border-blue-200 dark:border-blue-800/50',
                title: 'text-blue-800 dark:text-blue-200',
                icon: 'text-blue-600 dark:text-blue-400',
                value: 'text-blue-900 dark:text-blue-100',
                subtitle: 'text-blue-700 dark:text-blue-300'
              },
              orange: {
                border: 'border-orange-200 dark:border-orange-800/50',
                title: 'text-orange-800 dark:text-orange-200',
                icon: 'text-orange-600 dark:text-orange-400',
                value: 'text-orange-900 dark:text-orange-100',
                subtitle: 'text-orange-700 dark:text-orange-300'
              }
            };

            const colors = colorClasses[card.color as keyof typeof colorClasses];

            return (
              <SwiperSlide key={index}>
                <Card 
                  className={`glass-card ${colors.border} h-full`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6">
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
          
          .dark .stats-swiper .swiper-pagination-bullet {
            background: #4b5563;
          }
          
          .stats-swiper .swiper-pagination-bullet-active {
            background: #6366f1;
          }
          
          .dark .stats-swiper .swiper-pagination-bullet-active {
            background: #8b5cf6;
          }
        `}</style>
      </div>
    </div>
  );
};