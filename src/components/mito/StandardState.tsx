import { ATP_COST_EV, ATP_COST_TEXTBOOK, STD_PSI, STD_UNCOUPLING, poRatio } from "@/lib/mito/reference";

/*
 * Standard state readout: shows the healthy-default values the green/amber
 * coloring is compared against, next to the live slider values, plus
 * published textbook ranges so model numbers can be checked against physiology.
 */

type Ref = {
  label: string;
  model: string;
  live: number;
  liveText: string;
  lo: number;
  hi: number;
  range: string;
  source: string;
  derived?: boolean;
  comparable?: boolean;
};

export function StandardStateNote({
  psi,
  uncoupling,
  poNadh,
  poFadh,
}: {
  psi: number;
  uncoupling: number;
  poNadh?: number;
  poFadh?: number;
}) {
  const atStandard = Math.abs(psi - STD_PSI) < 1e-9 && Math.abs(uncoupling - STD_UNCOUPLING) < 1e-9;
  const cost = ATP_COST_EV * (psi / STD_PSI);

  const refs: Ref[] = [
    {
      label: "Membrane potential",
      model: `${STD_PSI} mV`,
      live: psi,
      liveText: `${psi.toFixed(0)} mV`,
      lo: 150,
      hi: 180,
      range: "150 to 180 mV",
      source: "Nicholls & Ferguson, Bioenergetics 4 (2013)",
    },
    {
      label: "Proton leak (uncoupling)",
      model: `${(STD_UNCOUPLING * 100).toFixed(0)}%`,
      live: uncoupling * 100,
      liveText: `${(uncoupling * 100).toFixed(0)}%`,
      lo: 5,
      hi: 25,
      range: "No comparable range for model fraction",
      source: "Rolfe & Brand 1997; Brand 2005",
      comparable: false,
    },
    {
      label: "ATP synthesis cost",
      model: `${ATP_COST_EV.toFixed(2)} eV`,
      live: cost,
      liveText: `${cost.toFixed(2)} eV`,
      lo: ATP_COST_TEXTBOOK.lo,
      hi: ATP_COST_TEXTBOOK.hi,
      range: "0.50 to 0.62 eV (48 to 60 kJ/mol)",
      source: "Derived energetic cost, not a measured patient value",
      comparable: false,
    },
  ];
  if (poNadh != null)
    refs.push({
      label: "P/O (NADH)",
      model: poRatio(STD_PSI, STD_UNCOUPLING, "nadh").toFixed(2),
      live: poNadh,
      liveText: poNadh.toFixed(2),
      lo: 2.3,
      hi: 2.7,
      range: "2.5 (measured 2.3 to 2.7)",
      source: "Hinkle 2005; Watt et al. 2010",
      derived: true,
    });
  if (poFadh != null)
    refs.push({
      label: "P/O (FADH2)",
      model: poRatio(STD_PSI, STD_UNCOUPLING, "fadh2").toFixed(2),
      live: poFadh,
      liveText: poFadh.toFixed(2),
      lo: 1.4,
      hi: 1.7,
      range: "1.5 (measured 1.4 to 1.7)",
      source: "Hinkle 2005",
      derived: true,
    });

  return (
    <div
      data-testid="standard-state"
      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
    >
      <span className="font-semibold text-foreground">Standard state for green/amber:</span>{" "}
      membrane potential {STD_PSI} mV, uncoupling {(STD_UNCOUPLING * 100).toFixed(0)}%, ATP cost{" "}
      {ATP_COST_EV.toFixed(2)} eV/ATP.{" "}
      <span className="font-mono">
        Live: {psi.toFixed(0)} mV, {(uncoupling * 100).toFixed(0)}%, {cost.toFixed(2)} eV/ATP
      </span>{" "}
      {atStandard ? (
        <span className="text-primary">(at standard, labels green)</span>
      ) : (
        <span>(off standard, labels may turn amber)</span>
      )}

      <div className="mt-2 overflow-x-auto" data-testid="textbook-values">
        <div className="mb-1 font-semibold text-foreground">Published physiology</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide">
              <th className="pr-2 font-medium">Quantity</th>
              <th className="pr-2 font-medium">Model std</th>
              <th className="pr-2 font-medium">Live</th>
              <th className="pr-2 font-medium">Textbook</th>
              <th className="font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {refs.map((r) => {
              const inside = r.live >= r.lo - 1e-9 && r.live <= r.hi + 1e-9;
              const comparable = r.comparable !== false;
              return (
                <tr key={r.label} className="border-t border-border/60" data-testid={r.derived ? "physiology-po-row" : undefined} data-outside={comparable && !inside}>
                  <td className="py-0.5 pr-2 text-foreground">{r.label}{r.derived && <span className="block text-[10px] text-muted-foreground">Derived efficiency</span>}</td>
                  <td className="pr-2 font-mono">{r.model}</td>
                  <td className="pr-2 font-mono">
                    <span className={!comparable ? "text-muted-foreground" : inside ? "text-primary" : "text-destructive"}>{r.liveText}</span>
                    {!comparable && <span className="block text-[10px] text-muted-foreground">Not directly comparable to measured values</span>}
                    {r.derived && <span className={`block max-w-[260px] text-[10px] leading-relaxed ${inside ? "text-muted-foreground" : "text-destructive"}`} data-testid="physiology-po-dependency">
                      {inside ? "Within range" : "Outside range"} · dependent on membrane potential {psi.toFixed(0)} mV (standard {STD_PSI}) and uncoupling {(uncoupling * 100).toFixed(0)}% (standard {(STD_UNCOUPLING * 100).toFixed(0)}%). Not a separate slider.
                    </span>}
                  </td>
                  <td className="pr-2">{r.range}</td>
                  <td className="italic">{r.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-1 text-[10px]">
          Flags apply only to comparable quantities. P/O bands summarize published isolated-mitochondria estimates; membrane potential is an approximate intact-cell band. Uncoupling is a model control, not a measured proton-leak share; ATP cost is a derived energetic proxy. Tissue and assay values vary.
        </div>
      </div>
    </div>
  );
}
