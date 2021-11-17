import { VennElement } from './base-element';
import { AreaDetails } from './interfaces.js';

export class VennIntersection extends VennElement {
  private _sets: string[] = [];
  protected _size = 2;

  static get observedAttributes() {
    return ['sets', 'size', 'label'];
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

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'sets') {
      this.sets = newValue;
    } else {
      super.attributeChangedCallback(name, oldValue, newValue);
    }
  }

  computeAreas(): AreaDetails[] {
    const sets = this.sets;
    if (sets.length > 1) {
      return [
        {
          sets: [...this.sets].sort(),
          size: this.size,
          label: this.label,
          component: this,
        },
      ];
    }
    return [];
  }
}
customElements.define('venn-n', VennIntersection);

declare global {
  interface HTMLElementTagNameMap {
    'venn-n': VennIntersection;
  }
}