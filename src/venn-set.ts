import { VennElement } from './base-element';
import { AreaDetails } from './interfaces.js';

export class VennSet extends VennElement {
  private _name = '';
  private _label = '';
  private _size = 10;

  static get observedAttributes() {
    return ['name', 'size', 'label'];
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (value !== this._label) {
      this._label = value;
      this._firePropChange('label');
    }
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    if (value !== this._name) {
      this._name = value;
      this._firePropChange('name');
    }
  }

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    if (value !== this._size) {
      this._size = value;
      this._firePropChange('size');
    }
  }

  computeAreas(): AreaDetails[] {
    const areas: AreaDetails[] = [
      {
        sets: [this.name],
        size: this.size,
        label: this.label,
        component: this,
      },
    ];
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i] instanceof VennSet) {
        const childSet = (children[i] as VennSet);
        if (childSet.size >= this.size) {
          childSet.size = 0.5 * this.size;
        }
        const childAreas = childSet.computeAreas();
        if (childAreas && childAreas.length) {
          for (const ca of childAreas) {
            areas.push(ca);
            areas.push({
              sets: [this.name, ...ca.sets],
              size: Math.min(this.size, ca.size),
            });
          }
        }
      }
    }
    return areas;
  }
}
customElements.define('venn-set', VennSet);

declare global {
  interface HTMLElementTagNameMap {
    'venn-set': VennSet;
  }
}