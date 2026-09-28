import type { GeometryEffects, Outputs } from "@/lib/mito/model";

export type PartId =
  | "outer"
  | "inner"
  | "crista"
  | "junction"
  | "ci"
  | "cii"
  | "ciii"
  | "civ"
  | "atp"
  | "cytc"
  | "q"
  | "dna"
  | "tca"
  | "fes"
  | "ros"
  | "photon"
  | "thz";

const f = (v: number, d = 1) => (Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(2) : v.toFixed(d));

// Label card text for each clickable part: name, role, and a live model value.
export function partInfo(id: PartId, out: Outputs, ge: GeometryEffects): { name: string; role: string; live: string } {
  switch (id) {
    case "outer":
      return { name: "Outer membrane", role: "Porous boundary (VDAC). Swelling widens the gap to the inner membrane.", live: `Fe-S intact ${(out.fesIntact * 100).toFixed(1)}%` };
    case "inner":
      return { name: "Inner boundary membrane", role: "Holds the proton gradient; cardiolipin rich.", live: `Cardiolipin oxidized ${f(out.cardiolipinOx)}%` };
    case "crista":
      return { name: "Crista (lamellar fold)", role: "Folded inner membrane that packs the respiratory chain and traps cytochrome c.", live: `Relative area ${f(ge.area, 2)}x, local Δψ ${ge.psiShift >= 0 ? "+" : ""}${f(ge.psiShift)} mV` };
    case "junction":
      return { name: "Crista junction (OPA1 / MICOS)", role: "Narrow neck that seals the intracristal space.", live: `Cyt c retention ${f(ge.cytcRetention, 2)}x` };
    case "ci":
      return { name: "Complex I (NADH:ubiquinone oxidoreductase)", role: "L-shaped; 8 Fe-S clusters carry electrons from NADH to Q. Main site IQ/IF superoxide.", live: `Flux ${f(out.fluxCI)} rel` };
    case "cii":
      return { name: "Complex II (succinate dehydrogenase)", role: "[2Fe-2S] to [4Fe-4S] to [3Fe-4S] wire from succinate to Q.", live: `Flux ${f(out.fluxCII)} rel` };
    case "ciii":
      return { name: "Complex III (bc1 dimer)", role: "Rieske [2Fe-2S]; Q cycle. Site IIIQo leaks superoxide to both sides.", live: `Superoxide ${f(out.superoxide, 3)} nM` };
    case "civ":
      return { name: "Complex IV (cytochrome c oxidase)", role: "CuA and heme a/a3 absorb red / NIR light; NO binds heme a3-CuB.", live: `Flux ${f(out.fluxCIV)} rel, NO released ${f(out.noReleased)}%` };
    case "atp":
      return { name: "ATP synthase dimer rows", role: "Dimers bend the crista tip; F1 heads make ATP from the proton flow.", live: `ATP flux ${f(out.atpFlux)} rel` };
    case "cytc":
      return { name: "Cytochrome c", role: "Mobile carrier from CIII to CIV in the intracristal space.", live: `CIV supply ${f(ge.cytcRetention, 2)}x` };
    case "q":
      return { name: "Ubiquinone pool (Q / QH2)", role: "Lipid-soluble carrier from CI and CII to CIII.", live: `CI + CII flux ${f(out.fluxCI + out.fluxCII)} rel` };
    case "dna":
      return { name: "mtDNA nucleoid", role: "Circular genome encoding 13 core OXPHOS subunits.", live: `Hydroxyl radical ${f(out.hydroxylRadical, 3)} pM` };
    case "tca":
      return { name: "TCA cycle (aconitase [4Fe-4S])", role: "Feeds NADH and succinate; aconitase cluster is the most ROS-sensitive.", live: `Aconitase ${f(out.aconitaseActivity)}%` };
    case "fes":
      return { name: "Fe-S cluster", role: "Intact clusters cycle redox; damaged ones release Fe2+ that fuels Fenton chemistry.", live: `Intact ${(out.fesIntact * 100).toFixed(1)}%, free iron ${f(out.freeIron, 2)} µM` };
    case "ros":
      return { name: "ROS puffs", role: "Superoxide at CI and CIII, dismutated to H2O2 by SOD2.", live: `O2•- ${f(out.superoxide, 3)} nM, H2O2 ${f(out.hydrogenPeroxide)} nM, ONOO- ${f(out.peroxynitrite, 3)} nM` };
    case "photon":
      return { name: "Red / NIR photons", role: "Absorbed mainly by CIV chromophores after tissue attenuation.", live: `Fluence red ${f(out.photoreceptor.fluence.red, 2)}, NIR ${f(out.photoreceptor.fluence.nir, 2)} J/cm2` };
    case "thz":
      return { name: "71 THz coherence (relative reporter)", role: "Pumped membrane mode; hypothesis, not radiometric.", live: `Emission ${f(out.emission71THz)} rel, coherent ${(out.coherentFraction * 100).toFixed(0)}%` };
  }
}
