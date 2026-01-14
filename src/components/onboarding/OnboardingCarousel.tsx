import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Users, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingSlide from "./OnboardingSlide";
import logo from "@/assets/logo.png";

const slides = [
  {
    icon: Timer,
    title: "Track Your Runs",
    description: "Sync with Strava to automatically track all your runs, pace, and distance in one place.",
  },
  {
    icon: Users,
    title: "Join The Community",
    description: "Connect with fellow runners from Erode. Compete on leaderboards and join club challenges.",
  },
  {
    icon: Trophy,
    title: "Achieve Your Goals",
    description: "Follow training plans, earn badges, and celebrate your running achievements together.",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, onComplete]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-safe-top px-6 pt-8 pb-4 flex flex-col items-center"
      >
        <img 
          src={logo} 
          alt="Erode Runners Club" 
          className="h-20 w-auto object-contain"
        />
      </motion.div>

      {/* Slides Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            <OnboardingSlide
              icon={slides[currentSlide].icon}
              title={slides[currentSlide].title}
              description={slides[currentSlide].description}
              isActive={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-safe-bottom pb-8 space-y-6">
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 gradient-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={nextSlide}
            className="w-full h-14 text-base font-semibold gradient-primary border-0 text-white hover:opacity-90 transition-opacity"
          >
            {isLastSlide ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>

          {!isLastSlide && (
            <Button
              variant="ghost"
              onClick={onComplete}
              className="w-full h-12 text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
