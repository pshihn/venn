import { VennDiagram, AreaDetails } from './venn-diagram';

import './venn-diagram.js';

const sets: AreaDetails[] = [
  { sets: ['A'], size: 0 },
  { sets: ['B'], size: 0 },
  { sets: ['A', 'B'], size: 5 },
];

const vd = document.querySelector('venn-diagram') as VennDiagram;
vd.sets = sets;