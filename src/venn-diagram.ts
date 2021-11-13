import { Circle } from './interfaces.js';
import { DiagramConfig, diagram } from './venn/diagram.js';

interface SetElement {
  id: string;
  circle: Circle;
  circleNode: SVGCircleElement;
  groupNode: SVGGElement;
}

export interface AreaDetails {
  sets: string[];
  size: number;
  fill?: string;
  opacity?: number;
}

const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

export class VennDiagram extends HTMLElement {
  private _root: ShadowRoot;
  private __svg?: SVGSVGElement;

  private _config: DiagramConfig = {
    height: 350,
    width: 600,
  };
  private _areas: AreaDetails[] = [];
  private _areaMap = new Map<string, AreaDetails>();
  private _setList = new Set<SetElement>();
  private _setMap = new Map<string, SetElement>();
  private _colorIndex = 0;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `
    <style>
      :host {
        display: inline-block;
        position: relative;
      }
      * {
        box-sizing: border-box;
      }
      svg {
        display: block;
        border: 1px solid #000;
      }
    </style>
    <svg></svg>
    `;
  }

  set sets(value: AreaDetails[]) {
    value = value || [];
    if (JSON.stringify(value) !== JSON.stringify(this._areas)) {
      this._areas = value;
      this._areaMap.clear();
      value.forEach((d) => {
        this._areaMap.set(d.sets.join('|'), d);
        d.size = d.size || 10;
        d.fill = d.fill || this._nextColor();
        if (typeof d.opacity !== 'number') {
          d.opacity = 0.25;
        }
      });
      this._render();
    }
  }

  private get _svg(): SVGSVGElement {
    if (!this.__svg) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.__svg = this._root.querySelector('svg')!;
    }
    return this.__svg;
  }

  private _nextColor(): string {
    const color = COLORS[this._colorIndex++];
    if (this._colorIndex >= COLORS.length) {
      this._colorIndex = 0;
    }
    return color;
  }

  private _render() {
    const svg = this._svg;
    svg.setAttribute('width', `${this._config.width || 600}`);
    svg.setAttribute('height', `${this._config.height || 350}`);

    const { circles } = diagram(this._areas, this._config);
    const usedElements = new Set<SetElement>();
    for (const id in circles) {
      const circle = circles[id];
      let se = this._setMap.get(id);
      if (!se) {
        const g = svg.ownerDocument.createElementNS(NS, 'g');
        const c = svg.ownerDocument.createElementNS(NS, 'circle');
        c.setAttribute('id', `set-${id.toLowerCase().replace(' ', '')}`);
        g.appendChild(c);
        svg.appendChild(g);
        se = {
          id,
          circle,
          circleNode: c,
          groupNode: g,
        };
        this._setMap.set(id, se);
      } else {
        this._setList.delete(se);
      }

      usedElements.add(se);
      se.circleNode.setAttribute('r', `${circle.radius}`);
      const g = se.groupNode;
      g.setAttribute('transform', `translate(${circle.x} ${circle.y})`);
      const area = this._areaMap.get(id);
      if (area) {
        if (area.fill) {
          g.style.fill = area.fill;
        }
        if (area.opacity) {
          g.style.fillOpacity = `${area.opacity}`;
        }
      }
    }

    // set list cleanup
    for (const se of this._setList) {
      this._setMap.delete(se.id);
      const gp = se.groupNode.parentElement;
      if (gp) {
        gp.removeChild(se.groupNode);
      }
    }
    this._setList = usedElements;
  }
}
customElements.define('venn-diagram', VennDiagram);