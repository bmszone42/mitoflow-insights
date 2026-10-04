import { demoPatients } from "@/lib/mito/patientReference";
import { diagnoseProfile } from "@/lib/mito/diagnosis";
let t=0,th=0,pr=0; for (const p of demoPatients){const d:any=diagnoseProfile(p); th+=d.therapyFlags.length; pr+=d.projectedFlags.filter((e:any)=>e.detail.includes("clears")).length; t+= (d.causes.filter((c:any)=>c.score>=1.5).length);}
console.log("strong causes",t,"therapy flags",th,"projected clears",pr);
