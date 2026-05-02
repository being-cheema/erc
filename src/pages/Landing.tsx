import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import {
  BarChart3,
  Trophy,
  Zap,
  Dumbbell,
  Smartphone,
  Apple,
  ChevronRight,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Track Every Run",
    desc: "Auto-sync from Strava. Distance, pace, heart rate — all in one place.",
    color: "from-orange-500 to-rose-500",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    desc: "Compete with fellow club members. Monthly and all-time rankings.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "Achievements",
    desc: "Unlock badges for milestones. First 5K, 100K month, and more.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Dumbbell,
    title: "Training Plans",
    desc: "Structured plans from beginner to advanced. Track your progress.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Calendar,
    title: "Race Calendar",
    desc: "Stay updated on upcoming races. Register and track participants.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Join Erode's growing running community. Run together, grow together.",
    color: "from-teal-500 to-cyan-500",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-strava/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          <motion.img
            src={logo}
            alt="Erode Runners Club"
            className="h-28 w-auto mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          />

          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            Run to
            <br />
            <span className="bg-gradient-to-r from-strava via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Live.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 font-medium max-w-md mx-auto mb-10 leading-relaxed">
            Erode's premier running community. Track your runs, compete with friends, and push your limits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/signup")}
              className="h-14 px-10 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava/90 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-strava/30"
            >
              Join the Club
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="h-14 px-10 text-base font-bold uppercase tracking-wide rounded-2xl border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Log In
            </Button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-strava mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Everything you need
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all duration-300 hover:bg-white/[0.05]"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Download Section */}
      <section className="px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-strava mb-3">Download</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
              Get the App
            </h2>
            <p className="text-white/50 mb-12 max-w-md mx-auto">
              Take your running data everywhere. Available on Android and iOS.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {/* Android */}
            <motion.a
              href="/downloads/erode-runners-club.apk"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-green-500/30 hover:bg-green-500/5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Android</p>
                <p className="text-lg font-bold text-white">Download APK</p>
              </div>
            </motion.a>

            {/* iOS */}
            <motion.a
              href="https://testflight.apple.com/join/DBkSDDWn"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Apple className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">iOS (Beta)</p>
                <p className="text-lg font-bold text-white">TestFlight</p>
              </div>
            </motion.a>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-xs text-white/30"
          >
            iOS: Install <a href="https://apps.apple.com/app/testflight/id899247664" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">TestFlight</a> from the App Store first, then tap the link above.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="p-10 rounded-3xl bg-gradient-to-br from-strava/10 to-orange-600/5 border border-strava/20">
            <MapPin className="w-10 h-10 text-strava mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3">
              Ready to Run?
            </h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Join the Erode Runners Club community and start tracking your journey today.
            </p>
            <Button
              onClick={() => navigate("/signup")}
              className="h-14 px-12 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava/90 text-white rounded-2xl shadow-lg shadow-strava/30 hover:scale-105 active:scale-95 transition-all"
            >
              Create Account
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.06] text-center">
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Erode Runners Club. Built with ❤️ for runners.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
