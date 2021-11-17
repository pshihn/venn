import { VennElement } from './base-element';
import { AreaDetails } from './interfaces.js';

export class VennSet extends VennElement {
  private _name = '';
  private _label = '';
  protected _size = 10;

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
    let setChildren = 0;
    for (let i = 0; i < children.length; i++) {
      if (children[i] instanceof VennSet) {
        setChildren++;
      }
    }
    for (let i = 0; i < children.length; i++) {
      if (children[i] instanceof VennElement) {
        const childSet = (children[i] as VennElement);
        if (childSet.size >= this.size) {
          switch (setChildren) {
            case 0:
            case 1:
              childSet.size = this.size / 2;
              break;
            default:
              childSet.size = this.size / ((setChildren + 1) * 2);
              break;
          }
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