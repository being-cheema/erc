import { motion } from "framer-motion";
import RunnerIllustration from "./RunnerIllustration";

interface OnboardingSlideProps {
  variant: "solo" | "community" | "trophy";
  title: string;
  description: string;
  isActive: boolean;
}

const OnboardingSlide = ({ variant, title, description, isActive }: OnboardingSlideProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center px-8 py-4"
    >
      {/* Illustration Container with enhanced glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="relative mb-10 h-48 flex items-center justify-center"
      >
        {/* Pulsing glow ring */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-56 h-56 rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl" />
        </motion.div>

        {/* Secondary glow ring */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 0.9, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        >
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-accent/20 to-primary/10 blur-2xl" />
        </motion.div>

        {/* Illustration */}
        <RunnerIllustration variant={variant} className="relative z-10" />
      </motion.div>

      {/* Title with shimmer effect */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="relative mb-4"
      >
        <h2 className="text-3xl font-bold text-foreground tracking-tight relative z-10">
          {title}
        </h2>
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "easeInOut" 
          }}
        />
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
        className="text-muted-foreground text-base leading-relaxed max-w-[280px]"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default OnboardingSlide;
