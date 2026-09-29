import { ATP_COST_EV, STD_PSI, STD_UNCOUPLING } from "@/lib/mito/reference";

/*
 * Standard state readout: shows the healthy-default values the green/amber
 * coloring is compared against, next to the live slider values, so the
 * reference point is visible wherever the colors appear.
 */
export function StandardStateNote({ psi, uncoupling }: { psi: number; uncoupling: number }) {
  const atStandard = Math.abs(psi - STD_PSI) < 1e-9 && Math.abs(uncoupling - STD_UNCOUPLING) < 1e-9;
  return (
    <div
      data-testid="standard-state"
      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
    >
      <span className="font-semibold text-foreground">Standard state for green/amber:</span>{" "}
      membrane potential {STD_PSI} mV, uncoupling {(STD_UNCOUPLING * 100).toFixed(0)}%, ATP cost{" "}
      {ATP_COST_EV.toFixed(2)} eV/ATP.{" "}
      <span className="font-mono">
        Live: {psi.toFixed(0)} mV, {(uncoupling * 100).toFixed(0)}%,{" "}
        {(ATP_COST_EV * (psi / STD_PSI)).toFixed(2)} eV/ATP
      </span>{" "}
      {atStandard ? (
        <span className="text-primary">(at standard, labels green)</span>
      ) : (
        <span>(off standard, labels may turn amber)</span>
      )}
    </div>
  );
}
