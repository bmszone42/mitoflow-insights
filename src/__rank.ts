import { demoPatients } from "@/lib/mito/patientReference";
import { profileInputs } from "@/lib/mito/treatment";
import { simulate, defaultGeometry } from "@/lib/mito/model";
const r = demoPatients.map(p=>{const i=profileInputs(p);return [p.label.slice(0,40), i.antioxidantCapacity.toFixed(2), i.deltaPsi, simulate(i,defaultGeometry).superoxide.toFixed(4)]}).sort((a,b)=>+b[3]-+a[3]);
console.log(r.map(x=>x.join(" | ")).join("\n"));
