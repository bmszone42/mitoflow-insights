import type { MelovHeartSplit } from "@/lib/mito/model";

const SHORT = { aconitase: "A", complexI: "I", complexII: "II", complexIII: "III" } as const;

/** Per-enzyme heart check cell: A / I / II / III, red when within the ±5-point Melov window. */
export function HeartSplit({ h, after }: { h: Record<"aconitase" | "complexI" | "complexII" | "complexIII", MelovHeartSplit>; after?: boolean }) {
  return (
    <>
      {(["aconitase", "complexI", "complexII", "complexIII"] as const).map((k, i) => (
        <span key={k}>
          {i > 0 && " · "}
          {SHORT[k]}{" "}
          <span className={h[k].inBand ? "text-destructive" : after ? "text-primary" : ""}>{h[k].pct.toFixed(0)}%</span>
        </span>
      ))}
    </>
  );
}

export const HEART_SPLIT_TITLE =
  "Per-enzyme model Fe-S intact % vs the Melov 1999 Sod2-null mouse heart: complex I 59%, complex II 24% of normal; red within ±5 points of the figure, a tolerance I chose, not published. A = aconitase, III = complex III (Rieske); both have no published Melov figure.";
