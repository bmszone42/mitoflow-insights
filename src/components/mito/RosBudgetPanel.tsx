import type { Outputs } from "@/lib/mito/model";
import { BudgetBar } from "./SimulatorShared";

export function RosBudgetPanel({ out }: { out: Outputs }) {
  const b = out.rosBudget;
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">ROS sources and sinks</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          IMS O2•- {(b.superoxideIMS * 1e3).toPrecision(3)} pM · Prx3 hyperoxidized {(b.prxHyperoxidized * 100).toFixed(1)}% · Fe2+{" "}
          {(b.fe2Fraction * 100).toFixed(0)}%
        </span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <BudgetBar title="Superoxide sources" parts={b.superoxideSources} />
        <BudgetBar title="Superoxide sinks (matrix)" parts={b.superoxideSinks} />
        <BudgetBar title="H2O2 sources" parts={b.h2o2Sources} />
        <BudgetBar title="H2O2 sinks" parts={b.h2o2Sinks} />
        <BudgetBar title="Peroxynitrite sinks" parts={b.peroxynitriteSinks} />
        <BudgetBar title="Hydroxyl radical sources" parts={b.hydroxylSources} />
      </div>
    </div>
  );
}
