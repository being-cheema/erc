import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MembershipCardProps {
  displayName: string;
  memberId: string;
  joinDate: string;
  avatarUrl?: string | null;
  expandable?: boolean;
  large?: boolean;
  className?: string;
}

// Format: ERCXXXXXXXXXXX -> ERC-XXXX-XXXX-XXXXX
function formatMemberId(id: string): string {
  if (!id || id.length < 7) return id;
  return `${id.slice(0, 3)}-${id.slice(3, 7)}-${id.slice(7, 11)}-${id.slice(11)}`;
}

const MembershipCard = ({
  displayName,
  memberId,
  joinDate,
  avatarUrl,
  expandable = false,
  large = false,
  className,
}: MembershipCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (memberId) {
      const profileUrl = `https://eroderunnersclub.com/m/${memberId}`;
      QRCode.toDataURL(profileUrl, {
        width: large ? 220 : 120,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
        errorCorrectionLevel: "M",
      }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
    }
  }, [memberId, large]);

  const formattedDate = new Date(joinDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const cardNode = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full mx-auto", large ? "max-w-3xl" : "max-w-sm", className)}
    >
      <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "1.6/1" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FC4C02] via-orange-400 to-amber-400" />

        <div className={cn("relative z-10 h-full flex flex-col justify-between", large ? "p-8" : "p-5")}>
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center", large ? "gap-3.5" : "gap-2.5")}>
              <img src={logo} alt="ERC" className={cn("w-auto", large ? "h-12" : "h-8")} />
              <div>
                <p className={cn("font-bold uppercase tracking-[0.2em] text-white/40", large ? "text-xs" : "text-[10px]")}>
                  Member
                </p>
                <p className={cn("font-extrabold uppercase tracking-wider text-white/80", large ? "text-base" : "text-xs")}>
                  Erode Runners Club
                </p>
              </div>
            </div>
          </div>

          <div className={cn("flex items-end justify-between", large ? "gap-6" : "gap-4")}>
            <div className="flex-1 min-w-0">
              <p className={cn("font-black text-white tracking-tight truncate leading-tight", large ? "text-3xl" : "text-lg")}>
                {displayName}
              </p>
              <p className={cn("font-mono font-bold text-[#FC4C02] tracking-wider mt-1", large ? "text-base" : "text-[11px]")}>
                {formatMemberId(memberId)}
              </p>
              <p className={cn("font-semibold text-white/25 uppercase tracking-wider mt-1.5", large ? "text-xs" : "text-[10px]")}>
                Since {formattedDate}
              </p>
            </div>

            <div className={cn("shrink-0 bg-white/[0.06] rounded-xl backdrop-blur-sm border border-white/[0.06]", large ? "p-3" : "p-2")}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Member profile QR" className={cn(large ? "w-[120px] h-[120px]" : "w-[72px] h-[72px]")} />
              ) : (
                <div className={cn("bg-white/10 rounded", large ? "w-[120px] h-[120px]" : "w-[72px] h-[72px]")} />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!expandable) return cardNode;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-left cursor-zoom-in"
        aria-label="Open membership card"
      >
        {cardNode}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] border-none bg-transparent p-0 shadow-none">
          <MembershipCard
            displayName={displayName}
            memberId={memberId}
            joinDate={joinDate}
            avatarUrl={avatarUrl}
            large
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export { formatMemberId };
export default MembershipCard;
