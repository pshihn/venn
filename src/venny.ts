import { Area } from './interfaces';
import { VennDiagram } from './venn-diagram';

import './venn-diagram.js';

const sets: Area[] = [
  { sets: ['A'], size: 12 },
  { sets: ['B'], size: 12 },
  { sets: ['A', 'B'], size: 2 },
];

const vd = document.querySelector('venn-diagram') as VennDiagram;
vd.sets = sets;