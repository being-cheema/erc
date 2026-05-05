import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface MembershipCardProps {
  displayName: string;
  memberId: string;
  joinDate: string;
  avatarUrl?: string | null;
}

// Format: ERCXXXXXXXXXXX -> ERC-XXXX-XXXX-XXXXX
function formatMemberId(id: string): string {
  if (!id || id.length < 7) return id;
  return `${id.slice(0, 3)}-${id.slice(3, 7)}-${id.slice(7, 11)}-${id.slice(11)}`;
}

const MembershipCard = ({ displayName, memberId, joinDate, avatarUrl }: MembershipCardProps) => {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrRef.current && memberId) {
      QRCode.toCanvas(qrRef.current, memberId, {
        width: 120,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
        errorCorrectionLevel: "M",
      });
    }
  }, [memberId]);

  const formattedDate = new Date(joinDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "1.6/1" }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a]" />
        
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FC4C02] via-orange-400 to-amber-400" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          {/* Top: Logo + Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="ERC" className="h-8 w-auto" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Member
                </p>
                <p className="text-xs font-extrabold uppercase tracking-wider text-white/80">
                  Erode Runners Club
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Info + QR */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Name */}
              <p className="text-lg font-black text-white tracking-tight truncate leading-tight">
                {displayName}
              </p>
              
              {/* Member ID */}
              <p className="text-[11px] font-mono font-bold text-[#FC4C02] tracking-wider mt-1">
                {formatMemberId(memberId)}
              </p>

              {/* Join date */}
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mt-1.5">
                Since {formattedDate}
              </p>
            </div>

            {/* QR Code */}
            <div className="shrink-0 bg-white/[0.06] rounded-xl p-2 backdrop-blur-sm border border-white/[0.06]">
              <canvas ref={qrRef} className="w-[72px] h-[72px]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export { formatMemberId };
export default MembershipCard;
