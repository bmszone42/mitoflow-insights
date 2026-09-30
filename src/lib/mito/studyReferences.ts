// Publication spans and article IDs are bibliographic locators, not verified claim-specific pages.
// Model-comment citations without a confirmed work are tracked separately below.
export type StudyReference = { doi: string; authors: string; title: string; journal: string; year: number; location: string; url: string; section: string; locator?: string };
export const studyReferences: StudyReference[] = [
  {
    "doi": "10.3390/jcm12103560",
    "authors": "Cristina González‐Mingot, F. MENA, Pedro Iñarrea, Cristina Íñiguez, Jose Luis Capablo, Rosario Osta, Anna Gil-Sánchez, Luís Brieva, Pilar Larrodé",
    "title": "Mitochondrial Aconitase Enzymatic Activity: A Potential Long-Term Survival Biomarker in the Blood of ALS Patients",
    "journal": "Journal of Clinical Medicine 12(10)",
    "year": 2023,
    "location": "Article 3560",
    "url": "https://doi.org/10.3390/jcm12103560",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1021/bi00199a034",
    "authors": "Vladimir D. Sled, Ned I. Rudnitzky, Youssef Hatefi, Tomoko Ohnishi",
    "title": "Thermodynamic Analysis of Flavin in Mitochondrial NADH:Ubiquinone Oxidoreductase (Complex I)",
    "journal": "Biochemistry 33(33)",
    "year": 1994,
    "location": "pp. 10069–10075",
    "url": "https://doi.org/10.1021/bi00199a034",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1042/bj1860111",
    "authors": "W J Ingledew, T Ohnishi",
    "title": "An analysis of some thermodynamic properties of iron-sulphur centres in site I of mitochondria",
    "journal": "Biochemical Journal 186(1)",
    "year": 1980,
    "location": "pp. 111–117",
    "url": "https://doi.org/10.1042/bj1860111",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1007/s40828-019-0085-4",
    "authors": "Rona R. Ramsay",
    "title": "Electron carriers and energy conservation in mitochondrial respiration",
    "journal": "ChemTexts 5(2)",
    "year": 2019,
    "location": "Article 9",
    "url": "https://doi.org/10.1007/s40828-019-0085-4",
    "section": "ETC energetics",
    "locator": "Table 1"
  },
  {
    "doi": "10.1007/s10863-008-9174-6",
    "authors": "Haibo Zhang, Sarah E. Chobot, Artur Osyczka, Colin A. Wraight, P. Leslie Dutton, Christopher C. Moser",
    "title": "Quinone and non-quinone redox couples in Complex III",
    "journal": "Journal of Bioenergetics and Biomembranes 40(5)",
    "year": 2008,
    "location": "pp. 493–499",
    "url": "https://doi.org/10.1007/s10863-008-9174-6",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1016/j.bbabio.2011.03.003",
    "authors": "M. Fátima Lucas, Denis L. Rousseau, Victor Guallar",
    "title": "Electron transfer pathways in cytochrome c oxidase",
    "journal": "Biochimica et Biophysica Acta (BBA) - Bioenergetics 1807(10)",
    "year": 2011,
    "location": "pp. 1305–1313",
    "url": "https://doi.org/10.1016/j.bbabio.2011.03.003",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1038/s41598-018-25779-w",
    "authors": "Jóhanna Vilhjálmsdóttir, Robert B. Gennis, Peter Brzezinski",
    "title": "The electron distribution in the “activated” state of cytochrome c oxidase",
    "journal": "Scientific Reports 8(1)",
    "year": 2018,
    "location": "Article 7502",
    "url": "https://doi.org/10.1038/s41598-018-25779-w",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1152/japplphysiol.01160.2012",
    "authors": "David F. Wilson, David K. Harrison, Sergei A. Vinogradov",
    "title": "Oxygen, pH, and mitochondrial oxidative phosphorylation",
    "journal": "Journal of Applied Physiology 113(12)",
    "year": 2012,
    "location": "pp. 1838–1845",
    "url": "https://doi.org/10.1152/japplphysiol.01160.2012",
    "section": "ATP and respiratory controls",
    "locator": ""
  },
  {
    "doi": "10.1016/j.ab.2017.07.009",
    "authors": "Ljubava D. Zorova, Vasily A. Popkov, Egor Y. Plotnikov, Denis N. Silachev, Irina B. Pevzner, Stanislovas S. Jankauskas, Valentina A. Babenko, Savva D. Zorov, Anastasia V. Balakireva, Magdalena Juhaszova, Steven J. Sollott, Dmitry B. Zorov",
    "title": "Mitochondrial membrane potential",
    "journal": "Analytical Biochemistry 552",
    "year": 2018,
    "location": "pp. 50–59",
    "url": "https://doi.org/10.1016/j.ab.2017.07.009",
    "section": "ATP and respiratory controls",
    "locator": ""
  },
  {
    "doi": "10.1016/B978-0-12-388425-1.00003-8",
    "authors": "David G. Nicholls, Stuart J. Ferguson",
    "title": "Quantitative Bioenergetics",
    "journal": "Bioenergetics, 4th ed. Academic Press",
    "year": 2013,
    "location": "Chapter 3, pp. 27–51",
    "url": "https://doi.org/10.1016/B978-0-12-388425-1.00003-8",
    "section": "ATP and respiratory controls",
    "locator": ""
  },
  {
    "doi": "10.1023/A:1027327015957",
    "authors": "David F. S. Rolfe, Martin D. Brand",
    "title": "The Physiological Significance of Mitochondrial Proton Leak in Animal Cells and Tissues",
    "journal": "Bioscience Reports 17(1)",
    "year": 1997,
    "location": "pp. 9–16",
    "url": "https://doi.org/10.1023/A:1027327015957",
    "section": "ATP and respiratory controls",
    "locator": ""
  },
  {
    "doi": "10.1016/S0891-5849(02)01006-7",
    "authors": "Or Kakhlon, Zvi Ioav Cabantchik",
    "title": "The labile iron pool: characterization, measurement, and participation in cellular processes",
    "journal": "Free Radical Biology and Medicine 33(8)",
    "year": 2002,
    "location": "pp. 1037–1046",
    "url": "https://doi.org/10.1016/S0891-5849(02)01006-7",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1016/S0005-2728(00)00238-3",
    "authors": "Guy C. Brown",
    "title": "Regulation of mitochondrial respiration by nitric oxide inhibition of cytochrome c oxidase",
    "journal": "Biochimica et Biophysica Acta (BBA) - Bioenergetics 1504(1)",
    "year": 2001,
    "location": "pp. 46–57",
    "url": "https://doi.org/10.1016/S0005-2728(00)00238-3",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1042/BJ20091541",
    "authors": "Andrew G. Cox, Christine C. Winterbourn, Mark B. Hampton",
    "title": "Mitochondrial peroxiredoxin involvement in antioxidant defence and redox signalling",
    "journal": "Biochemical Journal 425(2)",
    "year": 2009,
    "location": "pp. 313–325",
    "url": "https://doi.org/10.1042/BJ20091541",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.2203/dose-response.09-027.Hamblin",
    "authors": "Ying-Ying Huang, Aaron C.-H. Chen, James D. Carroll, Michael R. Hamblin",
    "title": "Biphasic Dose Response in Low Level Light Therapy",
    "journal": "Dose-Response 7(4)",
    "year": 2009,
    "location": "pp. 358–383",
    "url": "https://doi.org/10.2203/dose-response.09-027.Hamblin",
    "section": "Light and ferroptosis",
    "locator": ""
  },
  {
    "doi": "10.1088/0031-9155/58/11/R37",
    "authors": "Steven L Jacques",
    "title": "Optical properties of biological tissues: a review",
    "journal": "Physics in Medicine and Biology 58(11)",
    "year": 2013,
    "location": "pp. R37–R61",
    "url": "https://doi.org/10.1088/0031-9155/58/11/R37",
    "section": "Light and ferroptosis",
    "locator": ""
  },
  {
    "doi": "10.1016/0304-4165(85)90182-5",
    "authors": "Fulvio Ursini, Matilde Maiorino, Carlo Gregolin",
    "title": "The selenoenzyme phospholipid hydroperoxide glutathione peroxidase",
    "journal": "Biochimica et Biophysica Acta (BBA) - General Subjects 839(1)",
    "year": 1985,
    "location": "pp. 62–70",
    "url": "https://doi.org/10.1016/0304-4165(85)90182-5",
    "section": "Light and ferroptosis",
    "locator": ""
  },
  {
    "doi": "10.1038/s41586-019-1707-0",
    "authors": "Sebastian Doll, Florencio Porto Freitas, Ron Shah, Maceler Aldrovandi, Milene Costa da Silva, Irina Ingold, Andrea Goya Grocin, Thamara Nishida Xavier da Silva, Elena Panzilius, Christina H. Scheel, André Mourão, Katalin Buday, Mami Sato, Jonas Wanninger, Thibaut Vignane, Vaishnavi Mohana, Markus Rehberg, Andrew Flatley, Aloys Schepers, Andreas Kurz, Daniel White, Markus Sauer, Michael Sattler, Edward William Tate, Werner Schmitz, Almut Schulze, Valerie O’Donnell, Bettina Proneth, Grzegorz M. Popowicz, Derek A. Pratt, José Pedro Friedmann Angeli, Marcus Conrad",
    "title": "FSP1 is a glutathione-independent ferroptosis suppressor",
    "journal": "Nature 575(7784)",
    "year": 2019,
    "location": "pp. 693–698",
    "url": "https://doi.org/10.1038/s41586-019-1707-0",
    "section": "Light and ferroptosis",
    "locator": ""
  },
  {
    "doi": "10.1038/nchembio727",
    "authors": "Valerian E Kagan, Vladimir A Tyurin, Jianfei Jiang, Yulia Y Tyurina, Vladimir B Ritov, Andrew A Amoscato, Anatoly N Osipov, Natalia A Belikova, Alexandr A Kapralov, Vidisha Kini, Irina I Vlasova, Qing Zhao, Meimei Zou, Peter Di, Dimitry A Svistunenko, Igor V Kurnikov, Gregory G Borisenko",
    "title": "Cytochrome c acts as a cardiolipin oxygenase required for release of proapoptotic factors",
    "journal": "Nature Chemical Biology 1(4)",
    "year": 2005,
    "location": "pp. 223–232",
    "url": "https://doi.org/10.1038/nchembio727",
    "section": "Light and ferroptosis",
    "locator": ""
  },
  {
    "doi": "10.1016/j.cell.2013.08.032",
    "authors": "Sara Cogliati, Christian Frezza, Maria Eugenia Soriano, Tatiana Varanita, Ruben Quintana-Cabrera, Mauro Corrado, Sara Cipolat, Veronica Costa, Alberto Casarin, Ligia C. Gomes, Ester Perales-Clemente, Leonardo Salviati, Patricio Fernandez-Silva, Jose A. Enriquez, Luca Scorrano",
    "title": "Mitochondrial Cristae Shape Determines Respiratory Chain Supercomplexes Assembly and Respiratory Efficiency",
    "journal": "Cell 155(1)",
    "year": 2013,
    "location": "pp. 160–171",
    "url": "https://doi.org/10.1016/j.cell.2013.08.032",
    "section": "Cristae and membrane geometry",
    "locator": ""
  },
  {
    "doi": "10.1016/j.cell.2006.06.025",
    "authors": "Christian Frezza, Sara Cipolat, Olga Martins de Brito, Massimo Micaroni, Galina V. Beznoussenko, Tomasz Rudka, Davide Bartoli, Roman S. Polishuck, Nika N. Danial, Bart De Strooper, Luca Scorrano",
    "title": "OPA1 Controls Apoptotic Cristae Remodeling Independently from Mitochondrial Fusion",
    "journal": "Cell 126(1)",
    "year": 2006,
    "location": "pp. 177–189",
    "url": "https://doi.org/10.1016/j.cell.2006.06.025",
    "section": "Cristae and membrane geometry",
    "locator": ""
  },
  {
    "doi": "10.1093/emboj/21.3.221",
    "authors": "Patrick Paumard, Jacques Vaillier, Bénédicte Coulary, Jacques Schaeffer, Vincent Soubannier, David M. Mueller, Daniel Brèthes, Jean‐Paul di Rago, Jean Velours",
    "title": "The ATP synthase is involved in generating mitochondrial cristae morphology",
    "journal": "The EMBO Journal 21(3)",
    "year": 2002,
    "location": "pp. 221–230",
    "url": "https://doi.org/10.1093/emboj/21.3.221",
    "section": "Cristae and membrane geometry",
    "locator": ""
  },
  {
    "doi": "10.1016/j.bbabio.2004.09.004",
    "authors": "Peter C. Hinkle",
    "title": "P/O ratios of mitochondrial oxidative phosphorylation",
    "journal": "Biochimica et Biophysica Acta (BBA) - Bioenergetics 1706(1-2)",
    "year": 2005,
    "location": "pp. 1–11",
    "url": "https://doi.org/10.1016/j.bbabio.2004.09.004",
    "section": "ATP and respiratory controls",
    "locator": ""
  },
  {
    "doi": "10.1371/journal.pone.0336939",
    "authors": "John H. Lee, Jacob Vine, Lakshman Balaji, Natia Peradze, Nivedha Antony, Yanbo Wang, Andrea Morton, Ari Moskowitz, Michael W. Donnino, Xiaowen Liu",
    "title": "Mitochondrial respiration in peripheral blood mononuclear cells of healthy adult population",
    "journal": "PLOS One 21(1)",
    "year": 2026,
    "location": "Article e0336939",
    "url": "https://doi.org/10.1371/journal.pone.0336939",
    "section": "ATP and respiratory controls",
    "locator": "Table 2"
  },
  {
    "doi": "10.20455/ros.2016.865",
    "authors": "Megan Kauffman, Melinda Kauffman, Kassim Traore, Hong Zhu, Michael Trush, Zhenquan Jia, Y. Li",
    "title": "MitoSOX-Based Flow Cytometry for Detecting Mitochondrial ROS",
    "journal": "Reactive Oxygen Species 2(5)",
    "year": 2016,
    "location": "pp. 361–370",
    "url": "https://doi.org/10.20455/ros.2016.865",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1038/s42255-022-00591-z",
    "authors": "Michael P. Murphy, Hülya Bayir, Vsevolod Belousov, Christopher J. Chang, Kelvin J. A. Davies, Michael J. Davies, Tobias P. Dick, Toren Finkel, Henry J. Forman, Yvonne Janssen-Heininger, David Gems, Valerian E. Kagan, Balaraman Kalyanaraman, Nils-Göran Larsson, Ginger L. Milne, Thomas Nyström, Henrik E. Poulsen, Rafael Radi, Holly Van Remmen, Paul T. Schumacker, Paul J. Thornalley, Shinya Toyokuni, Christine C. Winterbourn, Huiyong Yin, Barry Halliwell",
    "title": "Guidelines for measuring reactive oxygen species and oxidative damage in cells and in vivo",
    "journal": "Nature Metabolism 4(6)",
    "year": 2022,
    "location": "pp. 651–662",
    "url": "https://doi.org/10.1038/s42255-022-00591-z",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1016/S0891-5849(02)00848-1",
    "authors": "Gregor P.C Drummen, Lydia C.M van Liebergen, Jos A.F Op den Kamp, Jan A Post",
    "title": "C11-BODIPY581/591, an oxidation-sensitive fluorescent lipid peroxidation probe: (micro)spectroscopic characterization and validation of methodology",
    "journal": "Free Radical Biology and Medicine 33(4)",
    "year": 2002,
    "location": "pp. 473–490",
    "url": "https://doi.org/10.1016/S0891-5849(02)00848-1",
    "section": "ROS, iron and assays",
    "locator": ""
  },
  {
    "doi": "10.1111/j.1432-1033.1969.tb00640.x",
    "authors": "P. F. Urban, M. Klingenberg",
    "title": "On the Redox Potentials of Ubiquinone and Cytochrome b in the Respiratory Chain",
    "journal": "European Journal of Biochemistry 9(4)",
    "year": 1969,
    "location": "pp. 519–525",
    "url": "https://doi.org/10.1111/j.1432-1033.1969.tb00640.x",
    "section": "ETC energetics",
    "locator": ""
  },
  {
    "doi": "10.1038/s41586-019-1705-2",
    "authors": "K. Bersuker, J. M. Hendricks, Z. Li, M. Magtanong, B. Ford, P. H. Tang, M. A. Roberts, B. Tong, T. J. Maimone, R. Zoncu, M. C. Bassik, D. K. Nomura",
    "title": "The CoQ oxidoreductase FSP1 acts parallel to GPX4 to inhibit ferroptosis",
    "journal": "Nature 575(7784)",
    "year": 2019,
    "location": "pp. 688–692",
    "url": "https://doi.org/10.1038/s41586-019-1705-2",
    "section": "Light and ferroptosis",
    "locator": ""
  }
] satisfies StudyReference[];

export const studySections = ["ETC energetics", "ATP and respiratory controls", "ROS, iron and assays", "Light and ferroptosis", "Cristae and membrane geometry"] as const;

// These model-source fragments lack confirmed work-level metadata or a reliable page locator.
export const unresolvedModelCitations = [
  "Chance & Boveri 1979; St-Pierre et al. 2002, JBC 277:44784 (electron leak)",
  "Fridovich 1995 (MnSOD)",
  "Koppenol 2001 (Fenton kinetics); Kissner et al. 1997 (NO and superoxide)",
  "Gardner & Fridovich 1991, JBC 266:19328; Lill 2009, Nature 460:831 (Fe-S)",
  "Karu 2010; Lane 2006, Nature 443:901; Karu 1999, J Photochem Photobiol B 49:1 (photoreceptors)",
  "Chen et al. 2011, PLoS One 6:e22453; Huang et al. 2013, J Biophotonics 6:829; Hockberger et al. 1999, PNAS 96:6255 (photon ROS)",
  "Brand 2016, Free Radic Biol Med 100:14; Quinlan et al. 2013, JBC 288:27103; Cox et al. 2010, Antioxid Redox Signal 12:311; Radi 2013, Acc Chem Res 46:550 (ROS sites and sinks)",
  "Dixon et al. 2012, Cell 149:1060 (ferroptosis)",
  "Passarella 1984, FEBS Lett 175:95; Frohlich 1968, Int J Quantum Chem 2:641; Sahu et al. 2013, Sci Rep 3:2471 (light and coherence)",
  "Strauss et al. 2008, EMBO J (cristae curvature); Watt et al. 2010 (ATP synthase)",
  "Scandroglio et al. 2014, Free Radic Res (aconitase; DOI in patient comparison does not resolve)",
] as const;
