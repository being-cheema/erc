import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingSlide from "./OnboardingSlide";
import { useHaptics } from "@/hooks/useHaptics";
import logo from "@/assets/logo.png";

const slides = [
  {
    variant: "solo" as const,
    title: "Track Every Mile",
    description: "Sync with Strava to automatically track all your runs, pace, and distance in one place.",
  },
  {
    variant: "community" as const,
    title: "Join Your Tribe",
    description: "Connect with fellow runners from Erode. Compete on leaderboards and push each other further.",
  },
  {
    variant: "trophy" as const,
    title: "Chase Your Goals",
    description: "Follow training plans, earn achievements, and celebrate every milestone together.",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef(null);
  const { lightImpact, mediumImpact, heavyImpact, selectionChanged, notificationSuccess } = useHaptics();

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      mediumImpact();
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      heavyImpact();
      notificationSuccess();
      onComplete();
    }
  }, [currentSlide, onComplete, mediumImpact, heavyImpact, notificationSuccess]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      lightImpact();
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide, lightImpact]);

  const goToSlide = (index: number) => {
    selectionChanged();
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      nextSlide();
    } else if (info.offset.x > threshold && currentSlide > 0) {
      prevSlide();
    }
  }, [currentSlide, nextSlide, prevSlide]);

  const handleSkip = useCallback(() => {
    lightImpact();
    onComplete();
  }, [lightImpact, onComplete]);

  const isLastSlide = currentSlide === slides.length - 1;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <motion.div 
      className="flex flex-col h-full min-h-screen bg-background"
      ref={constraintsRef}
    >
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
          animate={{
            opacity: [0.08, 0.15, 0.08],
          }}
          style={{
            background: isLastSlide 
              ? "radial-gradient(circle, hsl(var(--strava)) 0%, transparent 70%)"
              : "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Header with Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 pt-safe-top px-6 pt-10 pb-6 flex flex-col items-center"
      >
        <motion.img 
          src={logo} 
          alt="Erode Runners Club" 
          className="h-24 w-auto object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* Slides Container with swipe */}
      <motion.div 
        className="flex-1 flex items-center justify-center relative overflow-hidden z-10"
        onPanEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <OnboardingSlide
              variant={slides[currentSlide].variant}
              title={slides[currentSlide].title}
              description={slides[currentSlide].description}
              isActive={true}
            />
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint on first slide */}
        {currentSlide === 0 && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-muted-foreground/50 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Swipe to explore
            </motion.span>
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Section */}
      <div className="relative z-10 px-6 pb-safe-bottom pb-10 space-y-8">
        {/* Dots Indicator */}
        <div className="flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="relative py-2"
              aria-label={`Go to slide ${index + 1}`}
            >
              <motion.div
                className={`h-2 rounded-full transition-colors duration-300 ${
                  index === currentSlide
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                }`}
                animate={{
                  width: index === currentSlide ? 32 : 8,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={nextSlide}
              className={`w-full h-14 text-base font-semibold border-0 text-white transition-all duration-300 ${
                isLastSlide 
                  ? "bg-strava hover:bg-strava-dark shadow-lg"
                  : "gradient-primary hover:opacity-90 shadow-lg"
              }`}
            >
              {isLastSlide ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Get Started
                </span>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </motion.div>

          {!isLastSlide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full h-12 text-muted-foreground/70 hover:text-muted-foreground hover:bg-white/5"
              >
                Skip
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingCarousel;
