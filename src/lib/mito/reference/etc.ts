export type EtcStep = {
  step: string;
  donor: string;
  acceptor: string;
  emDonor: number; // midpoint potential E'm, mV
  emAcceptor: number;
  ev: number; // energy released per electron, eV (1 V = 1 eV per electron)
  protons: number; // H+ pumped per electron pair
  note: string;
  // Literature-derived comparison interval for ΔE, calculated from reported
  // pH 7 midpoint potentials. It is not a clinical or in situ normal range.
  tbLo: number;
  tbHi: number;
  rangeBasis: string;
  sourceCitation: string;
  sourceUrl: string;
};

// Point estimates are retained model parameters. Comparison intervals below are
// derived as acceptor E'm minus donor E'm from the cited experimental or review
// values. eV per electron is numerically equal to ΔE in volts.
export const etcSteps: EtcStep[] = [
  {
    step: "Complex I entry",
    donor: "NADH/NAD+",
    acceptor: "FMN",
    emDonor: -320,
    emAcceptor: -300,
    ev: 0.02,
    protons: 0,
    note: "NADH binds and reduces FMN; the small gap keeps flavin superoxide low at rest.",
    tbLo: 0.0,
    tbHi: 0.09,
    rangeBasis: "NADH −320 mV; bound FMN one-electron couples −414 and −336 mV (bovine heart, pH 7.5).",
    sourceCitation: "Sled VD et al. Biochemistry. 1994;33:10069–10075. doi:10.1021/bi00199a034",
    sourceUrl: "https://doi.org/10.1021/bi00199a034",
  },
  {
    step: "Complex I Fe-S relay",
    donor: "FMN",
    acceptor: "[4Fe-4S] N2",
    emDonor: -300,
    emAcceptor: -40,
    ev: 0.26,
    protons: 4,
    note: "Electrons cross N3-N7 to N2; the ~0.26 eV drop drives the four pumped protons.",
    tbLo: 0.1,
    tbHi: 0.35,
    rangeBasis: "Envelope from bound FMN values and the pH- and preparation-dependent N2 potential (approximately −150 to 0 mV).",
    sourceCitation: "Ingledew WJ, Ohnishi T. Biochem J. 1980;186:111–117. doi:10.1042/bj1860111",
    sourceUrl: "https://doi.org/10.1042/bj1860111",
  },
  {
    step: "Complex I to Q",
    donor: "[4Fe-4S] N2",
    acceptor: "Q/QH2",
    emDonor: -40,
    emAcceptor: 90,
    ev: 0.13,
    protons: 0,
    note: "Two electrons plus two matrix protons reduce ubiquinone to ubiquinol.",
    tbLo: 0.05,
    tbHi: 0.2,
    rangeBasis: "Derived from Q-pool midpoint potentials near +65 to +112 mV and the preparation-dependent N2 potential.",
    sourceCitation: "Urban PF, Klingenberg M. Eur J Biochem. 1969;9:519–525. doi:10.1111/j.1432-1033.1969.tb00640.x",
    sourceUrl: "https://doi.org/10.1111/j.1432-1033.1969.tb00640.x",
  },
  {
    step: "Complex II (FADH2)",
    donor: "Succinate/fumarate",
    acceptor: "Q/QH2",
    emDonor: 30,
    emAcceptor: 90,
    ev: -0.06,
    protons: 0,
    note: "Slightly uphill; driven by succinate mass action, so no protons are pumped.",
    tbLo: -0.09,
    tbHi: -0.01,
    rangeBasis: "Magnitude shown for the slightly uphill forward reaction, using succinate/fumarate +30 mV and Q 0 to +40 mV at pH 7.",
    sourceCitation: "Ramsay RR. ChemTexts. 2019;5:9. doi:10.1007/s40828-019-0085-4",
    sourceUrl: "https://doi.org/10.1007/s40828-019-0085-4",
  },
  {
    step: "Complex III Qo",
    donor: "QH2",
    acceptor: "Rieske [2Fe-2S] / cyt c1",
    emDonor: 90,
    emAcceptor: 280,
    ev: 0.19,
    protons: 4,
    note: "Q-cycle bifurcation: one electron to Rieske, one back to Qi; semiquinone here leaks O2•-.",
    tbLo: 0.1,
    tbHi: 0.28,
    rangeBasis: "Derived from Q-pool values and reported Rieske potentials; Qo quinone potentials are strongly site- and pH-dependent.",
    sourceCitation: "Zhang H et al. J Bioenerg Biomembr. 2008;40:493–499. doi:10.1007/s10863-008-9174-6",
    sourceUrl: "https://doi.org/10.1007/s10863-008-9174-6",
  },
  {
    step: "Cytochrome c shuttle",
    donor: "cyt c1",
    acceptor: "cytochrome c",
    emDonor: 280,
    emAcceptor: 235,
    ev: -0.045,
    protons: 0,
    note: "Near-equilibrium shuttle; cardiolipin-bound cyt c is the ferroptosis peroxidase switch.",
    tbLo: -0.06,
    tbHi: 0.04,
    rangeBasis: "Derived from cytochrome c1 near +220 mV and cytochrome c +254 mV at pH 7; local redox state controls direction.",
    sourceCitation: "Ramsay RR. ChemTexts. 2019;5:9, Table 1. doi:10.1007/s40828-019-0085-4",
    sourceUrl: "https://doi.org/10.1007/s40828-019-0085-4",
  },
  {
    step: "Complex IV CuA / heme a",
    donor: "cytochrome c",
    acceptor: "CuA / heme a",
    emDonor: 235,
    emAcceptor: 290,
    ev: 0.055,
    protons: 0,
    note: "CuA is the main 810 nm chromophore; heme a/a3 absorbs 660 nm.",
    tbLo: -0.02,
    tbHi: 0.1,
    rangeBasis: "Derived from cytochrome c +254 mV, CuA +240 mV and heme a +290 mV; assignments vary with redox state and method.",
    sourceCitation: "Ramsay RR. ChemTexts. 2019;5:9, Table 1; Lucas MF et al. BBA. 2011;1807:1305–1313. doi:10.1016/j.bbabio.2011.03.003",
    sourceUrl: "https://doi.org/10.1016/j.bbabio.2011.03.003",
  },
  {
    step: "Complex IV to O2",
    donor: "heme a3-CuB",
    acceptor: "O2/H2O",
    emDonor: 290,
    emAcceptor: 820,
    ev: 0.53,
    tbLo: 0.2,
    tbHi: 0.6,
    rangeBasis: "Envelope between equilibrium heme a3/CuB values and O2/H2O +800 mV; the catalytic active-state potential remains uncertain.",
    sourceCitation: "Vilhjálmsdóttir J et al. Sci Rep. 2018;8:7502. doi:10.1038/s41598-018-25779-w",
    sourceUrl: "https://doi.org/10.1038/s41598-018-25779-w",
    protons: 2,
    note: "The largest drop; 2 H+ pumped plus 2 chemical H+ per pair. NO binds here and light releases it.",
  },
{
    step: "Overall NADH to O2",
    donor: "NADH/NAD+",
    acceptor: "O2/H2O",
    emDonor: -320,
    emAcceptor: 820,
    ev: 1.14,
    protons: 10,
    note: "1.14 eV per electron, about 52 kcal/mol per pair; roughly 40% is captured as ATP.",
    tbLo: 1.12,
    tbHi: 1.14,
    rangeBasis: "Direct standard-state endpoint difference: O2/H2O +800 to +820 mV minus NADH/NAD+ −320 mV at pH 7.",
    sourceCitation: "Ramsay RR. ChemTexts. 2019;5:9, Table 1. doi:10.1007/s40828-019-0085-4",
    sourceUrl: "https://doi.org/10.1007/s40828-019-0085-4",
  },
];

/*
 * ATP yield estimates per step, two independent derivations (Nicholls & Ferguson,
 * Bioenergetics 4th ed.):
 *  - Proton-based: H_PER_ATP = 4 (3 H+ per ATP synthase rotation + ~1 H+ for Pi/ADP
 *    transport). ATP per pair = pumped protons / 4. Gives the modern 2.5 ATP per NADH.
 *  - Energy-based: usable energy = eV drop x 2 electrons; ATP_COST_EV = 0.52 eV
 *    (~50 kJ/mol at cellular ATP/ADP/Pi). ATP = energy / 0.52, clamped at 0 for
 *    uphill steps. Both are standard-state estimates, not per-step in-situ yields.
 */
