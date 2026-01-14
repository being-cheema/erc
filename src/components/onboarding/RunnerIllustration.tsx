import { motion } from "framer-motion";

interface RunnerIllustrationProps {
  variant: "solo" | "community" | "trophy";
  className?: string;
}

const RunnerIllustration = ({ variant, className = "" }: RunnerIllustrationProps) => {
  if (variant === "solo") {
    return (
      <div className={`relative ${className}`}>
        {/* Motion trails */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 bg-gradient-to-r from-primary/60 to-transparent rounded-full"
              style={{
                width: `${60 - i * 12}px`,
                left: `${-80 + i * 15}px`,
                top: `${i * 12 - 18}px`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scaleX: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>

        {/* Runner silhouette */}
        <motion.svg
          viewBox="0 0 120 140"
          className="w-32 h-40"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Running figure */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Head */}
            <circle cx="70" cy="25" r="12" fill="url(#runnerGradient)" />
            {/* Body */}
            <path
              d="M70 37 L70 70 M70 50 L50 65 M70 50 L90 60"
              stroke="url(#runnerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Front leg (extended) */}
            <path
              d="M70 70 L95 95 L105 125"
              stroke="url(#runnerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Back leg (bent) */}
            <path
              d="M70 70 L50 90 L35 80"
              stroke="url(#runnerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
          
          <defs>
            <linearGradient id="runnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Speed lines */}
        <motion.div
          className="absolute -right-4 top-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="h-0.5 bg-gradient-to-l from-strava to-transparent rounded-full mb-3"
              style={{ width: `${30 + i * 10}px` }}
              animate={{
                x: [0, 10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  if (variant === "community") {
    return (
      <div className={`relative flex items-end justify-center gap-2 ${className}`}>
        {/* Multiple runner silhouettes */}
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            viewBox="0 0 60 100"
            className={`${i === 1 ? "w-20 h-28" : "w-16 h-24"}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
          >
            <motion.g
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            >
              {/* Head */}
              <circle 
                cx="30" 
                cy="15" 
                r="8" 
                fill={i === 1 ? "hsl(var(--strava))" : "url(#communityGradient)"}
              />
              {/* Body */}
              <path
                d="M30 23 L30 50 M30 33 L18 45 M30 33 L42 42"
                stroke={i === 1 ? "hsl(var(--strava))" : "url(#communityGradient)"}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Legs */}
              <path
                d="M30 50 L42 70 L48 90 M30 50 L20 68 L12 62"
                stroke={i === 1 ? "hsl(var(--strava))" : "url(#communityGradient)"}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </motion.g>
            
            <defs>
              <linearGradient id="communityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </motion.svg>
        ))}

        {/* Connection lines */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="absolute left-1/4 top-0 w-12 h-px bg-gradient-to-r from-primary/50 to-strava/50"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute right-1/4 top-0 w-12 h-px bg-gradient-to-l from-primary/50 to-strava/50"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>
      </div>
    );
  }

  if (variant === "trophy") {
    return (
      <div className={`relative ${className}`}>
        {/* Glow effect behind trophy */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-500/30 via-strava/20 to-primary/30 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Trophy SVG */}
        <motion.svg
          viewBox="0 0 100 120"
          className="w-28 h-36 relative z-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {/* Trophy cup */}
          <motion.path
            d="M25 15 L25 5 L75 5 L75 15 L85 15 L85 35 C85 45 75 50 70 50 L70 55 C70 60 75 65 80 65 L80 70 L20 70 L20 65 C25 65 30 60 30 55 L30 50 C25 50 15 45 15 35 L15 15 Z"
            fill="url(#trophyGradient)"
            stroke="hsl(var(--strava))"
            strokeWidth="2"
          />
          {/* Handles */}
          <motion.path
            d="M15 20 C5 20 5 35 15 40"
            fill="none"
            stroke="url(#trophyGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <motion.path
            d="M85 20 C95 20 95 35 85 40"
            fill="none"
            stroke="url(#trophyGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Base */}
          <rect x="30" y="70" width="40" height="8" rx="2" fill="url(#trophyGradient)" />
          <rect x="20" y="78" width="60" height="10" rx="3" fill="url(#trophyGradient)" />
          
          {/* Star on trophy */}
          <motion.path
            d="M50 20 L53 30 L63 30 L55 36 L58 46 L50 40 L42 46 L45 36 L37 30 L47 30 Z"
            fill="white"
            animate={{
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <defs>
            <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="hsl(var(--strava))" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Sparkles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${10 + Math.random() * 40}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default RunnerIllustration;
