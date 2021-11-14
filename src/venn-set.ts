import { VennElement } from './base-element';
import { AreaDetails } from './interfaces.js';

const STRING_PROPS = ['name', 'fill', 'label'];
const NUMERIC_PROPS = ['size', 'opacity'];

export class VennSet extends VennElement {
  static get observedAttributes() {
    return [...STRING_PROPS, ...NUMERIC_PROPS];
  }

  constructor() {
    super();
    this._addProperties(this, STRING_PROPS, NUMERIC_PROPS);
  }

  computeAreas(): AreaDetails[] {
    const areas: AreaDetails[] = [
      {
        sets: [this._stringValue('name') || ''],
        size: this._numValue('size') || 0,
        fill: this._stringValue('fill'),
        opacity: this._numValue('opacity'),
        component: this,
      },
    ];
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i] instanceof VennElement) {
        const childAreas = (children[i] as VennElement).computeAreas();
        if (childAreas && childAreas.length) {
          areas.push(...childAreas);
        }
      }
    }
    return areas;
  }
}
customElements.define('venn-set', VennSet);