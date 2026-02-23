import { motion } from "framer-motion";

interface OnboardingSlideProps {
  variant: "solo" | "community" | "trophy";
  title: string;
  description: string;
  isActive: boolean;
}

const heroWords: Record<string, string> = {
  solo: "TRACK",
  community: "TRIBE",
  trophy: "GOAL",
};

const OnboardingSlide = ({ variant, title, description, isActive }: OnboardingSlideProps) => {
  const heroWord = heroWords[variant] || "RUN";
  const isLastSlide = variant === "trophy";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center px-8 py-4"
    >
      {/* Typography Hero */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="relative mb-10 h-48 flex items-center justify-center"
      >
        {/* Softer glow behind hero word */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.15, 0.3, 0.15],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <div className="w-56 h-56 rounded-full bg-primary/15 blur-[100px]" />
        </motion.div>

        {/* Giant hero word */}
        <motion.span
          className="relative z-10 text-[120px] font-black uppercase leading-none tracking-tighter text-foreground/10"
          style={{
            WebkitTextStroke: "2px hsl(var(--primary))",
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {heroWord}
        </motion.span>

        {/* Speed lines for TRACK variant */}
        {variant === "solo" && (
          <>
            <motion.div
              className="absolute left-8 top-1/2 h-[2px] rounded-full bg-gradient-to-r from-primary/60 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />
            <motion.div
              className="absolute left-12 top-[55%] h-[1px] rounded-full bg-gradient-to-r from-primary/30 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </>
        )}

        {/* Avatar circles for TRIBE variant */}
        {variant === "community" && (
          <motion.div
            className="absolute bottom-2 flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white/5 border-2 border-primary/20"
              />
            ))}
          </motion.div>
        )}

        {/* Progress bar for GOAL variant */}
        {isLastSlide && (
          <motion.div
            className="absolute bottom-4 w-48 h-2 rounded-full bg-white/5 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="mb-4"
      >
        <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">
          {isLastSlide ? "You're in Good Company!" : title}
        </h2>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
        className="text-foreground/70 text-base leading-relaxed max-w-[280px]"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default OnboardingSlide;
