import { VennElement } from './base-element';
import { AreaDetails } from './interfaces.js';

const STRING_PROPS = ['label'];
const NUMERIC_PROPS = ['size'];

export class VennSet extends VennElement {
  private _sets: string[] = [];

  static get observedAttributes() {
    return [...STRING_PROPS, ...NUMERIC_PROPS, 'sets'];
  }

  constructor() {
    super();
    this._addProperties(this, STRING_PROPS, NUMERIC_PROPS);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'sets') {
      this.sets = newValue;
    } else {
      super.attributeChangedCallback(name, oldValue, newValue);
    }
  }

  get sets(): string[] {
    return [...this._sets];
  }

  set sets(value: string[] | string) {
    if (typeof value === 'string') {
      this._sets = value.trim().split(' ').filter((d) => !!d);
    } else {
      this._sets = [...value];
    }
    this._firePropChange('sets');
  }

  computeAreas(): AreaDetails[] {
    const sets = this.sets;
    if (sets.length > 1) {
      return [
        {
          sets: this.sets,
          size: this._numValue('size') || 0,
          fill: this._stringValue('fill'),
          opacity: this._numValue('opacity'),
          component: this,
        },
      ];
    }
    return [];
  }


}
customElements.define('venn-n', VennSet);