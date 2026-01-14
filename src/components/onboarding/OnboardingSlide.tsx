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
      {/* Illustration Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="relative mb-10 h-44 flex items-center justify-center"
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl" />
        </motion.div>

        {/* Illustration */}
        <RunnerIllustration variant={variant} className="relative z-10" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="text-3xl font-bold text-foreground mb-4 tracking-tight"
      >
        {title}
      </motion.h2>

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
