'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SavingsGoal } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { Trophy, Target, CheckCircle2, Sparkles, Share2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CelebrationModalProps {
  goal: SavingsGoal | null;
  milestone?: number; // 0.25, 0.50, 0.75, 1.0
  isOpen: boolean;
  onClose: () => void;
  onShare?: (goal: SavingsGoal, milestone?: number) => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  goal,
  milestone,
  isOpen,
  onClose,
  onShare
}) => {
  const { formatCurrency } = useCurrency();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter');

  useEffect(() => {
    if (isOpen && goal) {
      setShowConfetti(true);
      setAnimationPhase('enter');
      
      // Animation sequence
      const enterTimer = setTimeout(() => setAnimationPhase('celebrate'), 300);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      
      return () => {
        clearTimeout(enterTimer);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen, goal]);

  if (!goal) return null;

  const isCompleted = milestone === 1.0 || goal.isCompleted;
  const milestonePercentage = milestone ? milestone * 100 : 100;

  const getCelebrationMessage = () => {
    if (isCompleted) {
      return {
        title: "🎉 Goal Completed!",
        subtitle: "Congratulations! You've reached your savings goal!",
        description: `You successfully saved ${formatCurrency(goal.targetAmount)} for "${goal.name}". This is a huge achievement!`
      };
    } else {
      return {
        title: `🎯 ${milestonePercentage}% Milestone Reached!`,
        subtitle: "You're making great progress!",
        description: `You've reached ${milestonePercentage}% of your "${goal.name}" goal. Keep up the excellent work!`
      };
    }
  };

  const celebration = getCelebrationMessage();

  const getAchievementBadge = () => {
    if (isCompleted) return "Goal Master";
    if (milestonePercentage >= 75) return "Almost There";
    if (milestonePercentage >= 50) return "Halfway Hero";
    if (milestonePercentage >= 25) return "Quarter Champion";
    return "Progress Maker";
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Every penny saved is a step closer to your dreams!",
      "Financial discipline today leads to freedom tomorrow.",
      "Small steps, big achievements!",
      "You're building a brighter financial future!",
      "Consistency is the key to financial success!",
      "Your future self will thank you for this!",
      "Saving money is a superpower - and you've got it!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full animate-bounce",
                i % 5 === 0 ? "bg-yellow-400" :
                i % 5 === 1 ? "bg-blue-400" :
                i % 5 === 2 ? "bg-green-400" :
                i % 5 === 3 ? "bg-red-400" : "bg-purple-400"
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 border-0">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="p-8 text-center space-y-6">
            {/* Main Icon */}
            <div className={cn(
              "mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
              animationPhase === 'celebrate' ? "scale-110" : "scale-100",
              isCompleted 
                ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                : "bg-gradient-to-br from-blue-400 to-purple-500"
            )}>
              {isCompleted ? (
                <Trophy className="h-10 w-10 text-white" />
              ) : (
                <Target className="h-10 w-10 text-white" />
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {celebration.title}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {celebration.subtitle}
              </p>
            </div>

            {/* Goal Card */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {goal.iconUrl && (
                    <img 
                      src={goal.iconUrl} 
                      alt={goal.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {goal.name}
                    </h3>
                    {goal.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000"
                      style={{ 
                        width: `${milestonePercentage}%`,
                        background: `linear-gradient(to right, ${goal.color}, ${goal.color}dd)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {milestonePercentage.toFixed(1)}% complete
                    </span>
                    {!isCompleted && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                      </span>
                    )}
                  </div>
                </div>

                {/* Achievement Badge */}
                <div className="flex justify-center">
                  <Badge 
                    className={cn(
                      "px-4 py-2 text-sm font-semibold",
                      isCompleted 
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" 
                        : "bg-gradient-to-r from-blue-400 to-purple-500 text-white"
                    )}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {getAchievementBadge()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {celebration.description}
            </p>

            {/* Motivational Quote */}
            <div className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-4 border border-white/60 dark:border-slate-700/60">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                "{getMotivationalQuote()}"
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(goal.currentAmount)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Amount Saved
                </div>
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {goal.createdAt ? Math.ceil((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Days Saving
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onShare && (
                <Button
                  variant="outline"
                  onClick={() => onShare(goal, milestone)}
                  className="flex-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Achievement
                </Button>
              )}
              <Button 
                onClick={onClose}
                className={cn(
                  "flex-1 text-white font-semibold",
                  isCompleted 
                    ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700" 
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isCompleted ? "Celebrate!" : "Keep Going!"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Mini celebration component for inline use
export const MiniCelebration: React.FC<{
  goal: SavingsGoal;
  milestone?: number;
  onClose: () => void;
}> = ({ goal, milestone, onClose }) => {
  const isCompleted = milestone === 1.0 || goal.isCompleted;
  const milestonePercentage = milestone ? milestone * 100 : 100;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800 shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              isCompleted 
                ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                : "bg-gradient-to-br from-green-400 to-blue-500"
            )}>
              {isCompleted ? (
                <Trophy className="h-5 w-5 text-white" />
              ) : (
                <Target className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {isCompleted ? "Goal Completed! 🎉" : `${milestonePercentage}% Milestone! 🎯`}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {goal.name} - {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
