import { motion, useScroll, useTransform } from "framer-motion";
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
  ArrowRight,
  Activity,
} from "lucide-react";
import { useRef } from "react";

const stats = [
  { value: "50+", label: "Active Runners" },
  { value: "10K+", label: "KMs Tracked" },
  { value: "100+", label: "Races Completed" },
];

const features = [
  {
    icon: Activity,
    title: "Auto-Sync from Strava",
    desc: "Connect once. Every run, walk, and ride syncs automatically with detailed metrics.",
    gradient: "from-orange-500 to-rose-600",
  },
  {
    icon: Trophy,
    title: "Live Leaderboard",
    desc: "Monthly rankings updated in real-time. See where you stand among fellow runners.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Zap,
    title: "Earn Achievements",
    desc: "Hit milestones and unlock badges. From your first 5K to 1000km totals.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Deep Stats",
    desc: "Pace trends, distance heatmaps, heart rate zones. Your data, visualized beautifully.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Dumbbell,
    title: "Training Plans",
    desc: "Structured programs for every level. Follow along and track your weekly progress.",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Calendar,
    title: "Race Calendar",
    desc: "Never miss a race. View upcoming events, register, and track who's running.",
    gradient: "from-pink-500 to-rose-600",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-strava/30 selection:text-white">
      {/* Fixed nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ERC" className="h-9 w-auto" />
            <span className="text-sm font-bold uppercase tracking-widest text-white/60 hidden sm:block">
              Erode Runners Club
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-sm font-semibold"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-strava hover:bg-strava/90 text-white rounded-xl text-sm font-semibold px-5 h-9 shadow-lg shadow-strava/20"
            >
              Join
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Gradient orbs */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-strava/15 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px]"
          />
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505] to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0, 1] }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Now accepting members</span>
          </motion.div>

          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black uppercase tracking-[-0.04em] leading-[0.85] mb-8">
            <span className="block text-white">Run</span>
            <span className="block bg-gradient-to-r from-strava via-orange-400 to-amber-300 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/40 max-w-lg mx-auto mb-12 leading-relaxed font-medium">
            Track your runs. Climb the leaderboard. Earn achievements.
            <br className="hidden sm:block" />
            Join Erode's fastest-growing running community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/signup")}
              className="h-14 px-10 text-base font-bold uppercase tracking-wider bg-white text-black hover:bg-white/90 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/10"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              className="h-14 px-10 text-base font-semibold text-white/50 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
            >
              I already have an account
            </Button>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-white/20" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats bar */}
      <section className="relative border-y border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-5xl font-black tracking-tight text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm font-semibold text-white/30 uppercase tracking-wider mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-28 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-strava/80 mb-4">Everything you need</p>
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95]">
            Built for
            <span className="text-white/30"> Runners.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-500 hover:bg-white/[0.04]"
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
              
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Download Section */}
      <section className="px-6 py-28 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-strava/80 mb-4">Mobile App</p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95] mb-4">
              Take it
              <span className="text-white/30"> with you.</span>
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-base">
              Get the full experience on your phone. Available on both platforms.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
            {/* Android */}
            <motion.a
              href="/downloads/erode-runners-club.apk"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex items-center gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all duration-300 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Android</p>
                <p className="text-xl font-black text-white tracking-tight">Download APK</p>
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
              className="group flex items-center gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/20 hover:bg-blue-500/[0.03] transition-all duration-300 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Apple className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">iOS Beta</p>
                <p className="text-xl font-black text-white tracking-tight">TestFlight</p>
              </div>
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-white/20 leading-relaxed">
              iOS users: Install{" "}
              <a href="https://apps.apple.com/app/testflight/id899247664" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400 transition-colors underline underline-offset-2">
                TestFlight
              </a>{" "}
              from the App Store first, then tap the link above to join the beta.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative p-12 sm:p-16 rounded-3xl overflow-hidden">
            {/* CTA background */}
            <div className="absolute inset-0 bg-gradient-to-br from-strava/10 via-orange-900/10 to-transparent border border-strava/10 rounded-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-strava/5 to-transparent rounded-3xl" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-strava to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-strava/30"
              >
                <MapPin className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-[0.9] mb-5">
                Your next
                <br />
                run starts here.
              </h2>
              <p className="text-white/35 mb-10 max-w-md mx-auto text-base leading-relaxed">
                Free to join. Connect your Strava. Start competing with the club today.
              </p>
              <Button
                onClick={() => navigate("/signup")}
                className="h-14 px-12 text-base font-bold uppercase tracking-wider bg-white text-black hover:bg-white/90 rounded-2xl shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ERC" className="h-7 w-auto opacity-40" />
            <span className="text-xs text-white/20 font-medium">© {new Date().getFullYear()} Erode Runners Club</span>
          </div>
          <p className="text-xs text-white/15">Built with ❤️ for runners, by runners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
