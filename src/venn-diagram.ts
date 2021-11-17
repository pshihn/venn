import { Circle, AreaDetails, SetIntersection, Point } from './interfaces.js';
import { DiagramConfig, diagram, intersectionAreaPath } from './venn/diagram.js';
import { VennElement } from './base-element';

interface CircleElement {
  id: string;
  circle: Circle;
  circleNode: SVGCircleElement;
  groupNode: SVGGElement;
  labelNode?: HTMLLabelElement;
}

interface IntersectionElement extends SetIntersection {
  id: string;
  pathNode: SVGPathElement;
  groupNode: SVGGElement;
  labelNode?: HTMLLabelElement;
}

const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

export class VennDiagram extends HTMLElement {
  private _connected = false;
  private _root: ShadowRoot;
  private __svg?: SVGSVGElement;
  private __labels?: HTMLDivElement;

  private _config: DiagramConfig = {
    height: 350,
    width: 600,
  };

  private _areas: AreaDetails[] = [];
  private _areaMap = new Map<string, AreaDetails>();

  private _circleList = new Set<CircleElement>();
  private _circleMap = new Map<string, CircleElement>();

  private _nList = new Set<IntersectionElement>();
  private _nMap = new Map<string, IntersectionElement>();

  private _renderRequestPending = false;

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
      }
      #labels {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      #labels label {
        position: absolute;
        top: 0;
        left: 0;
        user-select: none;
        font-size: var(--venn-label-size, 15px);
        font-family: var(--venn-label-font-family, system-ui, sans-serif);
        font-weight: var(--venn-label-font-weight, 400);
      }
    </style>
    <svg></svg>
    <div id="labels"></div>
    `;
  }

  connectedCallback() {
    this._connected = true;
    this.addEventListener('area-add', this._areaChangeHandler);
    this.addEventListener('prop-change', this._areaChangeHandler);
    this._requestRender();
  }

  disconnectedCallback() {
    this._connected = false;
  }

  private _areaKey(d: AreaDetails | SetIntersection) {
    return [...d.sets].sort().join(',');
  }

  private _areaChangeHandler = (event: Event) => {
    event.stopPropagation();
    this._requestRender();
  };

  private _requestRender() {
    if (this._connected && (!this._renderRequestPending)) {
      this._renderRequestPending = true;
      setTimeout(() => {
        try {
          if (this._connected) {
            const areas: AreaDetails[] = [];
            const children = this.children;
            for (let i = 0; i < children.length; i++) {
              if (children[i] instanceof VennElement) {
                const childAreas = (children[i] as VennElement).computeAreas();
                if (childAreas && childAreas.length) {
                  areas.push(...childAreas);
                }
              }
            }
            this._renderData(areas);
          }
        } finally {
          this._renderRequestPending = false;
        }
      }, 0);
    }
  }

  private _renderData(value: AreaDetails[]) {
    if (!this._connected) {
      return;
    }
    value = value || [];

    if (JSON.stringify(value) !== JSON.stringify(this._areas)) {
      this._areas = value;
      this._areaMap.clear();
      value.forEach((d) => {
        this._areaMap.set(this._areaKey(d), d);
        if (!d.size) {
          if (d.sets.length === 1) {
            d.size = 10;
          } else if (d.sets.length > 1) {
            d.size = 2;
          }
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

  private get _labels(): HTMLDivElement {
    if (!this.__labels) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.__labels = this._root.querySelector('#labels')!;
    }
    return this.__labels;
  }

  private _renderLabel(area: AreaDetails, textCenters: Map<string, Point>, se: CircleElement | IntersectionElement, color: string, maxWidth?: number) {
    const labels = this._labels;
    let labelNode = se.labelNode;
    if (area.label) {
      if (!labelNode) {
        labelNode = document.createElement('label');
        labelNode.style.color = color;
        se.labelNode = labelNode;
        labels.appendChild(labelNode);
      }
      labelNode.textContent = area.label;
      const centerPoint = textCenters.get(this._areaKey(area)) || { x: 0, y: 0 };
      labelNode.style.transform = `translate3d(-50%, -50%, 0) translate3d(${centerPoint.x}px, ${centerPoint.y}px, 0px)`;
      labelNode.style.maxWidth = maxWidth ? `${maxWidth}px` : '12em';
    } else {
      if (labelNode) {
        labels.removeChild(labelNode);
        se.labelNode = undefined;
      }
    }
  }

  private _render() {
    const svg = this._svg;
    svg.setAttribute('width', `${this._config.width || 600}`);
    svg.setAttribute('height', `${this._config.height || 350}`);

    const { circles, textCenters } = diagram(this._areas, this._config);
    const usedCircles = new Set<CircleElement>();
    const usedIntersections = new Set<IntersectionElement>();

    let colorIndex = 0;
    const nextColor = () => {
      const color = COLORS[colorIndex++];
      if (colorIndex >= COLORS.length) {
        colorIndex = 0;
      }
      return color;
    };

    // **********************
    // RENDER CIRCLES
    // **********************

    for (const id in circles) {
      const circle = circles[id];
      // check if an element already exists for this id
      // if not, render a node
      let se = this._circleMap.get(id);
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
        this._circleMap.set(id, se);
      } else {
        this._circleList.delete(se);
      }

      usedCircles.add(se);
      se.circleNode.setAttribute('r', `${circle.radius}`);
      const { groupNode, circleNode } = se;
      groupNode.setAttribute('transform', `translate(${circle.x} ${circle.y})`);
      circleNode.style.fill = nextColor();
      circleNode.style.fillOpacity = '0.25';
      const area = this._areaMap.get(id);
      if (area) {
        if (area.component) {
          area.component.setSvgNode(se.groupNode);
        }
        const maxWidth = Math.max(100, se.circle.radius * 2 * 0.6);
        this._renderLabel(area, textCenters, se, circleNode.style.fill, maxWidth);
      }
    }
    // Cleanup the list - remove unused shapes
    for (const se of this._circleList) {
      this._circleMap.delete(se.id);
      const gp = se.groupNode.parentElement;
      if (gp) {
        gp.removeChild(se.groupNode);
      }
    }
    this._circleList = usedCircles;

    // **********************
    // RENDER INTERSECTIONS
    // **********************

    const setIntersections: SetIntersection[] = [];
    for (const area of this._areas) {
      if (area.sets.length > 1) {
        const setCircles = (area.sets.map((d) => this._circleMap.get(d)?.circle).filter((d) => !!d)) as Circle[];
        const intersection = intersectionAreaPath(setCircles);
        if (intersection) {
          setIntersections.push({
            sets: [...area.sets],
            path: intersection.path,
            size: area.size,
          });
        }
      }
    }
    setIntersections.sort((a, b) => {
      if (a.sets.length === b.sets.length) {
        return b.size - a.size;
      }
      return a.sets.length - b.sets.length;
    });
    for (const intersection of setIntersections) {
      const key = this._areaKey(intersection);
      // check if shape element already exists
      let intersectionElement = this._nMap.get(key);
      if (intersectionElement) {
        this._nList.delete(intersectionElement);
      } else {
        const g = svg.ownerDocument.createElementNS(NS, 'g');
        const path = svg.ownerDocument.createElementNS(NS, 'path');
        path.setAttribute('id', `intersection-${key.toLowerCase().replace(',', '-')}`);
        g.appendChild(path);
        svg.appendChild(g);
        intersectionElement = {
          id: key,
          sets: [...intersection.sets],
          path: intersection.path,
          size: intersection.size,
          groupNode: g,
          pathNode: path,
        };
        this._nMap.set(key, intersectionElement);
      }

      usedIntersections.add(intersectionElement);
      intersectionElement.pathNode.setAttribute('d', `${intersectionElement.path}`);
      const g = intersectionElement.groupNode;
      const area = this._areaMap.get(key);
      if (area) {
        g.style.fillOpacity = '0';
        if (area.component) {
          area.component.setSvgNode(intersectionElement.groupNode);
        }
        this._renderLabel(area, textCenters, intersectionElement, '');
      }
    }
    // Cleanup the list - remove unused shapes
    for (const intersectionElement of this._nList) {
      this._nMap.delete(intersectionElement.id);
      const gp = intersectionElement.groupNode.parentElement;
      if (gp) {
        gp.removeChild(intersectionElement.groupNode);
      }
    }
    this._nList = usedIntersections;
  }
}
customElements.define('venn-diagram', VennDiagram);

declare global {
  interface HTMLElementTagNameMap {
    'venn-diagram': VennDiagram;
  }
}