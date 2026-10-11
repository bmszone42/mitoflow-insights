// Barrel: reference data split by topic in reference/.
// Bump REFERENCE_VERSION when any cited number changes; backups stamp it so a
// file made under different reference numbers is refused on load, not mixed in.
export const REFERENCE_VERSION = 1;
export * from "./reference/ros";
export * from "./reference/fes";
export * from "./reference/etc";
export * from "./reference/atp";
export * from "./reference/notes";
