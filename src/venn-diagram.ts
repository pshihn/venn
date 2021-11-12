import { Circle, Area } from './interfaces.js';
import { DiagramConfig, diagram } from './venn/diagram.js';

interface SetElement {
  id: string;
  circle: Circle;
  circleNode: SVGCircleElement;
  groupNode: SVGGElement;
}

export class VennDiagram extends HTMLElement {
  private _root: ShadowRoot;
  private __svg?: SVGSVGElement;

  private _config: DiagramConfig = {
    height: 350,
    width: 600,
  };
  private _areas: Area[] = [];
  private _setList = new Set<SetElement>();
  private _setMap = new Map<string, SetElement>();

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

  set sets(value: Area[]) {
    value = value || [];
    if (JSON.stringify(value) !== JSON.stringify(this._areas)) {
      this._areas = value;
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
        const g = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
        const c = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
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
      se.groupNode.setAttribute('transform', `translate(${circle.x} ${circle.y})`);
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