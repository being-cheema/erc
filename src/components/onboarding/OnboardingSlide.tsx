import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface OnboardingSlideProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive: boolean;
}

const OnboardingSlide = ({ icon: Icon, title, description, isActive }: OnboardingSlideProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        scale: isActive ? 1 : 0.9 
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center px-8"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center glow-primary">
          <motion.div
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/20 rounded-full blur-md"
          animate={{ 
            scaleX: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-2xl font-bold text-foreground mb-4"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-muted-foreground text-base leading-relaxed max-w-xs"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default OnboardingSlide;
