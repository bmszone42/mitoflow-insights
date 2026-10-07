import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useStrengthRange } from "@/lib/mito/rangeState";
import type { Inputs } from "@/lib/mito/model";

// Plain-words explainer shown above the Simulator for the three terms the rest
// of the app assumes you know: strength, band and gap. It reads the live slider
// value and the saved band so the words match what the charts are coloring.
// Dismissal is remembered in this browser only; a one-line link brings it back.
const KEY = "cristae-lab-start-here";

function readHidden() {
  try {
    return localStorage.getItem(KEY) === "hidden";
  } catch {
    return false;
  }
}

function Term({
  n,
  title,
  chip,
  chipTone,
  children,
}: {
  n: number;
  title: string;
  chip?: string;
  chipTone?: "in" | "out";
  children: ReactNode;
}) {
  const chipClass =
    chipTone === "out" ? "text-destructive" : chipTone === "in" ? "text-primary" : "text-accent";
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[11px] text-primary">
          {n}
        </span>
        <span className="text-xs font-semibold text-foreground">{title}</span>
        {chip && <span className={`ml-auto font-mono text-[11px] ${chipClass}`}>{chip}</span>}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function StartHereCard({ inputs }: { inputs: Inputs }) {
  const [hidden, setHidden] = useState(false);
  const [range] = useStrengthRange();
  useEffect(() => {
    setHidden(readHidden());
  }, []);

  const hide = () => {
    try {
      localStorage.setItem(KEY, "hidden");
    } catch {
      /* storage unavailable */
    }
    setHidden(true);
  };
  const show = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    setHidden(false);
  };

  if (hidden) {
    return (
      <p className="text-[11px] text-muted-foreground" data-testid="start-here-collapsed">
        <button
          type="button"
          className="underline underline-offset-2 hover:text-foreground"
          onClick={show}
          data-testid="start-here-show"
        >
          What do strength, band and gap mean?
        </button>
      </p>
    );
  }

  const strength = inputs.rirrStrength;
  const inside = strength >= range.lo && strength <= range.hi;

  return (
    <section
      className="panel border-l-2 border-l-accent p-4"
      data-testid="start-here-card"
      aria-label="Start here: strength, band and gap"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="mono-label">Start here</div>
          <h2 className="mt-0.5 text-sm font-semibold">Three words this app uses everywhere</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={hide}
          data-testid="start-here-hide"
        >
          Hide
        </Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Term
          n={1}
          title="Strength"
          chip={`${strength.toFixed(2)}x`}
          chipTone={inside ? "in" : "out"}
        >
          How strongly one burst of ROS pushes the mitochondrion to release even more ROS, a vicious
          cycle. 0x switches it off and the model starts at 1.0x. It only bites when antioxidant
          capacity is below normal, so weak defences plus a high strength is what makes superoxide
          snowball. You move it on the ROS-induced ROS release strength slider under Iron and
          defence, and the Progress page can save your value as the default for every page.
        </Term>
        <Term n={2} title="Band" chip={`${range.lo.toFixed(2)}x to ${range.hi.toFixed(2)}x`}>
          The stretch of strength you treat as plausible for you. Charts across the app color a
          result green when the strength behind it sits inside the band and red when it falls
          outside, so you can see at a glance whether a finding holds for you. Change it with the
          Band button at the top right of every page, or the sliders on Progress.
        </Term>
        <Term n={3} title="Gap (defences only)">
          How much more superoxide you would make than a healthy adult when nothing else differs:
          same membrane potential, same labile iron, same lactate to pyruvate ratio, only
          antioxidant capacity and strength changed. A positive gap means your defences look weaker
          than healthy. It is a model estimate, not a measurement. You will find it on Diagnosis,
          the Timeline and the scenario tables.
        </Term>
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-border p-3">
        <div className="mono-label">Try this first</div>
        <ol className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
          <li>1. Click a therapy lever or a drug preset on the left and watch the readouts move.</li>
          <li>2. Drag antioxidant capacity down and see superoxide and peroxide climb.</li>
          <li>3. Open Diagnosis to see your gap and which therapies close it.</li>
        </ol>
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        Model estimates for exploration and teaching, not clinical advice.
      </p>
    </section>
  );
}
