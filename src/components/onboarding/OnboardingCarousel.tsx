import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingSlide from "./OnboardingSlide";
import ParticleField from "./ParticleField";
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

// Background gradients for each slide
const slideBackgrounds = [
  "from-[hsl(210,30%,8%)] via-[hsl(200,35%,12%)] to-[hsl(190,40%,8%)]",
  "from-[hsl(220,35%,8%)] via-[hsl(210,30%,12%)] to-[hsl(195,35%,10%)]",
  "from-[hsl(25,40%,8%)] via-[hsl(220,25%,10%)] to-[hsl(210,30%,8%)]",
];

// Particle colors per slide
const particleColors: Array<"primary" | "accent" | "strava" | "mixed"> = ["primary", "mixed", "strava"];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef(null);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, onComplete]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      nextSlide();
    } else if (info.offset.x > threshold && currentSlide > 0) {
      prevSlide();
    }
  };

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

  // Memoize particle count based on slide
  const particleCount = useMemo(() => {
    return currentSlide === 2 ? 50 : 30;
  }, [currentSlide]);

  return (
    <motion.div 
      className={`flex flex-col h-full min-h-screen bg-gradient-to-br ${slideBackgrounds[currentSlide]} transition-all duration-700`}
      ref={constraintsRef}
    >
      {/* Particle Field */}
      <ParticleField 
        count={particleCount} 
        color={particleColors[currentSlide]} 
      />

      {/* Animated background orbs with enhanced glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/15 blur-[100px]"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent/15 blur-[100px]"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Center glow that intensifies on last slide */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px]"
          animate={{
            opacity: isLastSlide ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
            scale: isLastSlide ? [1, 1.3, 1] : [1, 1.1, 1],
          }}
          style={{
            background: isLastSlide 
              ? "radial-gradient(circle, hsl(var(--strava)) 0%, transparent 70%)"
              : "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Animated gradient mesh overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 20% 80%, hsl(var(--primary) / 0.3) 0%, transparent 50%),
                         radial-gradient(ellipse at 80% 20%, hsl(var(--accent) / 0.2) 0%, transparent 50%)`,
          }}
          animate={{
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Header with Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 pt-safe-top px-6 pt-10 pb-6 flex flex-col items-center"
      >
        <motion.div className="relative">
          {/* Logo glow ring */}
          <motion.div
            className="absolute -inset-4 rounded-full bg-primary/20 blur-xl"
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.img 
            src={logo} 
            alt="Erode Runners Club" 
            className="h-24 w-auto object-contain drop-shadow-2xl relative z-10"
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
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
        {/* Dots Indicator with enhanced glow */}
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
                    ? "bg-gradient-to-r from-primary to-accent"
                    : "bg-muted-foreground/20"
                }`}
                animate={{
                  width: index === currentSlide ? 32 : 8,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              {index === currentSlide && (
                <>
                  <motion.div
                    className="absolute inset-0 h-2 top-2 rounded-full bg-primary/40 blur-md"
                    layoutId="activeDotGlow"
                  />
                  {/* Particle burst on dot change */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                  </motion.div>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons with breathing glow */}
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            {/* Button glow effect */}
            <motion.div
              className={`absolute -inset-1 rounded-xl blur-lg ${
                isLastSlide ? "bg-strava/30" : "bg-primary/20"
              }`}
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <Button
              onClick={nextSlide}
              className={`relative w-full h-14 text-base font-semibold border-0 text-white transition-all duration-300 ${
                isLastSlide 
                  ? "bg-gradient-to-r from-strava to-orange-500 hover:from-strava/90 hover:to-orange-500/90 shadow-lg shadow-strava/30"
                  : "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
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
                onClick={onComplete}
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
