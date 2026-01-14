import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface ParticleFieldProps {
  count?: number;
  color?: "primary" | "accent" | "strava" | "mixed";
  className?: string;
}

const ParticleField = ({ count = 30, color = "mixed", className = "" }: ParticleFieldProps) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, [count]);

  const getParticleColor = (index: number) => {
    if (color === "primary") return "bg-primary";
    if (color === "accent") return "bg-accent";
    if (color === "strava") return "bg-strava";
    
    // Mixed colors
    const colors = ["bg-primary", "bg-accent", "bg-white"];
    return colors[index % colors.length];
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${getParticleColor(particle.id)} blur-[0.5px]`}
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
          }}
          initial={{ 
            y: `${particle.y}vh`,
            opacity: 0,
          }}
          animate={{
            y: [
              `${particle.y + 100}vh`,
              `${particle.y - 20}vh`,
            ],
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default ParticleField;
