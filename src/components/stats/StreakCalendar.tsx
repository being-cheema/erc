import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStreakCalendar } from "@/hooks/useStreakCalendar";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function getIntensity(distance: number): number {
  if (distance <= 0) return 0;
  if (distance < 3000) return 1;
  if (distance < 6000) return 2;
  if (distance < 10000) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  "#1b1f24",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const StreakCalendar = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useStreakCalendar(year);

  const dayMap = useMemo(() => {
    const map = new Map<string, any>();
    if (data?.days) {
      for (const d of data.days) {
        const rawKey = String(d.run_date ?? "");
        const normalizedKey = rawKey.includes("T") ? rawKey.split("T")[0] : rawKey;
        map.set(normalizedKey, d);
      }
    }
    return map;
  }, [data]);

  const weeks = useMemo(() => {
    const result: { date: Date; key: string }[][] = [];
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = (jan1.getDay() + 6) % 7; // Monday = 0

    let currentWeek: { date: Date; key: string }[] = [];
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), key: `pad-${i}` });
    }

    const endDate = year === currentYear ? new Date() : new Date(year, 11, 31);
    const cursor = new Date(jan1);

    while (cursor <= endDate) {
      const dateStr = toLocalDateKey(cursor);
      currentWeek.push({ date: new Date(cursor), key: dateStr });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [year, currentYear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Run Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-foreground">{year}</span>
          <button onClick={() => setYear(y => Math.min(y + 1, currentYear))} disabled={year >= currentYear} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><span className="text-foreground font-bold">{data.summary.active_days}</span> active days</span>
          <span><span className="text-foreground font-bold">{data.summary.total_runs}</span> runs</span>
          <span><span className="text-foreground font-bold">{(data.summary.total_distance / 1000).toFixed(0)}</span> km</span>
        </div>
      )}

      {/* Heatmap */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-[3px]" style={{ minWidth: weeks.length * 14 }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                if (day.key.startsWith('pad')) {
                  return <div key={day.key} className="w-[11px] h-[11px]" />;
                }
                const dayData = dayMap.get(day.key);
                const intensity = dayData ? getIntensity(Number(dayData.total_distance)) : 0;
                return (
                  <div
                    key={day.key}
                    className="w-[11px] h-[11px] rounded-[2px] transition-colors"
                    style={{ backgroundColor: INTENSITY_COLORS[intensity] }}
                    title={dayData ? `${day.key}: ${(dayData.total_distance / 1000).toFixed(1)}km, ${dayData.run_count} run(s)` : day.key}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {INTENSITY_COLORS.map((c, i) => (
          <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
};

export default StreakCalendar;
