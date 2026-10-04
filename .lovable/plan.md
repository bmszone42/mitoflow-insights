# Rewrite superoxide math so weak antioxidant defenses raise ROS

## Why the last change was not enough
Weak defenses only slowed superoxide clearance. Membrane potential still sets production, and the healthy adult has the highest potential (163 mV), so it stayed on top.

## The rewrite (two parts)
1. **Clearance fully follows defenses.** SOD clearance scales one to one with antioxidant capacity (exponent 0.8 to 1.0). Half the defenses means half the clearance.
2. **Weak defenses also raise production (new).** When the glutathione / Prx3 system is weak, oxidized thiols damage Complex I and III and they leak more electrons. This is a known vicious cycle (ROS-induced ROS release). Modeled as a production multiplier of capacity to the power -0.5: 0.64x defenses gives about 25% more leak, 1x gives none.

At 1x defenses nothing changes, so the healthy line stays where it is (about 0.0145 nM).

## Tested before proposing (top of the ranking)
| Profile | Defenses | Potential | Superoxide now | After rewrite |
|---|---|---|---|---|
| Demo 18 | 0.64x | 154 mV | 0.0136 | 0.0184 |
| Demo 06 | 0.62x | 151 mV | 0.0124 | 0.0172 |
| Demo 04 Leigh | 0.63x | 134 mV | 0.0123 | 0.0169 |
| Demo 10 | 0.84x | 159 mV | 0.0136 | 0.0153 |
| Demo 09 | 0.78x | 156 mV | 0.0128 | 0.0152 |
| Demo 11 | 0.73x | 153 mV | 0.0118 | 0.0147 |
| Demo 01 healthy | 0.98x | 163 mV | 0.0143 | 0.0145 |

Six disease profiles go above healthy. A stronger setting (power -1.0) pushes nine above, but it makes defenses dominate potential, which goes past what the literature supports, so I recommend -0.5.

## Knock-on effects
Peroxide, Fe-S damage, lipid peroxidation and ferroptosis all rise for low-defense profiles. Antioxidant therapies now show larger superoxide drops. Dashboard counts, Diagnosis, Timeline, projected clearance and every CSV change. Saved scenarios rerun with the new math. I will report the before and after flag counts.

## Also
- Cite the feedback loop (Zorov 2014, Physiol Rev, ROS-induced ROS release), checked live, scored and logged in the References page.
- Update the code notes and progress.md.

## Technical details
- `model.ts`: `SOD_AC_EXP = 1.0`; new constant `REDOX_FEEDBACK_EXP = 0.5`; `redoxFb = antioxidantCapacity ** -REDOX_FEEDBACK_EXP` multiplies `vMatrixO2` and `vImsO2`.
- Replace the SOD rule in `src/lib/mito/AGENTS.md` with one covering both constants.
- Verify with the profile ranking script, flag count before/after, and a browser check of Simulator, Dashboard and Diagnosis.
