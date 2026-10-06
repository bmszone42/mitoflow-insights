import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankedPair } from "@/lib/mito/pairRank";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

const lineColor = (i: number) => `var(--chart-${(i % 5) + 1})`;

export default function PairBandChart({ pairs, data, current, onSnap }: { pairs: RankedPair[]; data: Record<string, number>[]; current: number; onSnap?: (pair: RankedPair, index: number) => void }) {
  return (
    <div className="h-64 w-full" data-testid="pair-band-chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="s" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => `${Number(v).toFixed(2)}x`} fontSize={11} />
          <YAxis tickFormatter={(v) => `${Math.round(Number(v))}%`} fontSize={11} width={48} />
          <Tooltip formatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`} labelFormatter={(l) => `Strength ${Number(l).toFixed(2)}x`} />
          <Legend content={() => <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            {pairs.map((r, i) => <div key={`${r.tA.id}-${r.tB.id}`} className={`flex max-w-full items-center gap-2 ${["text-chart-1", "text-chart-2", "text-chart-3"][i]}`}>
              <span className="min-w-0">#{i + 1} {r.tA.name} + {r.tB.name} ({r.robust ? "holds" : "breaks"})</span>
              {onSnap && <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 gap-1 px-2" aria-label={`Snap pair ${i + 1}: ${r.tA.name} + ${r.tB.name}`} onClick={() => onSnap(r, i)}><CalendarPlus className="size-3" />Snap</Button>}
            </div>)}
          </div>} />
          <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 2" label={{ value: "no change", fontSize: 10, fill: "var(--destructive)", position: "insideTopRight" }} />
          <ReferenceLine x={current} stroke="var(--muted-foreground)" strokeDasharray="2 2" label={{ value: "now", fontSize: 10, position: "top" }} />
          {pairs.map((r, i) => (
            <Line key={i} type="monotone" dataKey={`p${i}`} name={`#${i + 1} ${r.tA.name} + ${r.tB.name}${r.robust ? " (holds)" : " (breaks)"}`} stroke={lineColor(i)} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
