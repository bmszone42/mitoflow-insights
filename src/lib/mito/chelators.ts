/**
 * Published chelator redox data: how much a chelator suppresses the reactivity of the iron it holds.
 * Replaces the earlier flat "95% suppression assumed" with measured inhibition from the literature.
 *
 * fenton: fraction of hydroxyl-radical (Fenton) reactivity removed from bound iron.
 * lipid:  fraction of lipid-peroxidation (ferroptosis propagation) reactivity removed from bound iron.
 */
export type ChelatorData = {
  id: string;
  name: string;
  fenton: number;
  lipid: number;
  fentonSource: { text: string; url: string };
  lipidSource: { text: string; url: string };
  note: string;
};

const GRAF = { text: "Graf, Mahoney, Bryant & Eaton 1984, J Biol Chem 259:3620", url: "https://doi.org/10.1016/S0021-9258(17)43139-5" };
const TIM15 = { text: "Timoshnikov et al. 2015, Free Radic Biol Med 78:118", url: "https://doi.org/10.1016/j.freeradbiomed.2014.10.513" };
const TIM21 = { text: "Timoshnikov et al. 2021, Molecules 26:5064", url: "https://doi.org/10.3390/molecules26165064" };

export const CHELATORS: ChelatorData[] = [
  {
    id: "dfo",
    name: "Deferoxamine (DFO)",
    // Graf 1984: Fe-Desferal has no open coordination site and produced no detectable hydroxyl radical.
    // "No detectable" is read here as >=99% suppression; the exact residual was below the assay limit.
    fenton: 0.99,
    lipid: 0.99,
    fentonSource: GRAF,
    lipidSource: GRAF,
    note: "Hexadentate 1:1 complex with no coordinated water, so no Fenton site. No separate lipid-peroxidation figure; the same value is used.",
  },
  {
    id: "deferiprone",
    name: "Deferiprone (L1)",
    // Timoshnikov 2015 (EPR spin trapping): L1 completely inhibited OH production from both Fe2+ and Fe3+.
    // Timoshnikov 2021: L1 slowed linoleic acid peroxidation about 500x (= 0.998).
    fenton: 0.99,
    lipid: 0.998,
    fentonSource: TIM15,
    lipidSource: TIM21,
    note: "3:1 complex; complete hydroxyl-radical inhibition by EPR, about 500x slower lipid peroxidation.",
  },
  {
    id: "deferasirox",
    name: "Deferasirox",
    // Timoshnikov 2021: >100x slower iron-catalysed ascorbate oxidation (0.99), but only ~6x slower
    // linoleic acid peroxidation (0.83), so it protects lipids far less than deferiprone.
    fenton: 0.99,
    lipid: 0.83,
    fentonSource: TIM21,
    lipidSource: TIM21,
    note: "Lipophilic 2:1 complex; strong on iron-catalysed oxidation but only about 6x on lipid peroxidation.",
  },
  {
    id: "mitoChelator",
    name: "Mitochondria-targeted chelator (mitoDFO)",
    fenton: 0.99,
    lipid: 0.99,
    fentonSource: GRAF,
    lipidSource: GRAF,
    note: "No published redox figures; the deferoxamine values are used because the iron-binding group is the same (assumed).",
  },
];

export function chelator(id: string): ChelatorData | undefined {
  return CHELATORS.find((c) => c.id === id);
}

/** Model defaults when no therapy has set a chelator: the deferoxamine (Graf 1984) values. */
export const DEFAULT_CHELATOR_FENTON = 0.99;
export const DEFAULT_CHELATOR_LIPID = 0.99;
/** Scenarios saved before this change carry no suppression fields; they keep the old flat 95% value. */
export const LEGACY_CHELATOR_SUPPRESSION = 0.95;
