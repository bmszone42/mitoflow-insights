# Calibrate the ROS-induced strength from Melov 1999

I got the real figures. The Williams 1998 paper is still paywalled, but Melov 1999 is free to read in full and gives hard numbers for mice with no SOD2 at all.

## What the paper reports

In Sod2 null mice:
- Heart aconitase down 89% (11% of control)
- Brain aconitase down 67 to 76% (24 to 33% of control), across brainstem, cortex, striatum, cerebellum
- Complex II (succinate dehydrogenase) 24% of control in heart, 35% in skeletal muscle
- Complex I 59% of control in heart
- The paper also cites an earlier report of total tissue aconitase down 22 to 43%

Aconitase is the classic Fe-S enzyme the model already tracks as "Fe-S intact", so this maps onto the model directly.

## How the fit comes out

Running the model with antioxidant capacity at its floor (0.2x, the closest it gets to no SOD) and sweeping the strength:

| Strength | Fe-S intact vs healthy |
|---|---|
| 0 (off) | 72% |
| 0.5 (current) | 50% |
| 1.0 | 29% |
| 1.25 | 21% |
| 1.5 | 15% |

The published brain range is 24 to 33%. Strength 1.0 lands at 29%, in the middle of it. The current 0.5 setting is far too weak: it predicts half the Fe-S survives where the mice kept a quarter. The heart figure (11%) is more severe than the model reaches at all, so brain is the honest anchor.

## Changes

1. **Set the default strength to 1.0** in `model.ts`, replacing the assumed 0.5.
2. **Relabel it** everywhere from "assumed" to "partly published": the Simulator slider, the settings reference, the Progress grid and the sensitivity card. The label will say the value is fitted to brain aconitase loss in Sod2 null mice, with the caveat that mice without any SOD2 are a rougher stand-in than mice with half.
3. **Log Melov 1999** in the study references and the scored reference library, with synopsis and a score out of 100, per the standing rule.
4. **Add a "clear log and re-run at new strength" button** on the Progress page, so the grid can be reset to the new value in one click instead of mixing old 0.5 runs with new ones.
5. **Re-check all 18 profiles** after the change: how many cross the healthy superoxide line, plus the Diagnosis cause counts, therapy flags and projected clearances, and report the before/after.
6. **Update progress.md** and the model rules file.

## What stays uncertain

The strength is now fitted to a published Fe-S loss, but it is fitted to full knockout mice, not to humans and not to partial loss. The mapping from the mouse anchor to the model's 0.2x capacity floor is still my judgment. That is why the label becomes "partly published" rather than "published".

## Expect this to shift the numbers

At 0.5 strength, 6 disease profiles sit above the healthy superoxide line. At 1.0 it was 11 in an earlier sweep. Dashboard counts, Diagnosis flags, defences-only gaps and every download will move accordingly. Saved scenarios keep their own stored strength and are untouched.
