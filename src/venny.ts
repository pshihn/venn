import { VennDiagram } from './diagram';
import { Area } from './interfaces';

const sets: Area[] = [
  { sets: ['A'], size: 12 },
  { sets: ['B'], size: 12 },
  { sets: ['A', 'B'], size: 2 },
];


const vd = new VennDiagram();
console.log(vd.render(sets));