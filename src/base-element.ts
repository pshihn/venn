/* eslint-disable @typescript-eslint/no-explicit-any */

import { PropChangeEvent } from './prop-change-event';
import { AreaDetails } from './interfaces.js';

export abstract class BaseElement extends HTMLElement {
  private _properties = new Set<string>();
  private _connected = false;

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (this._properties.has(name)) {
      (this as any)[name] = newValue;
    }
  }

  protected _stringValue(prop: string): string | undefined {
    return (this as any)[prop];
  }

  protected _numValue(prop: string): number | undefined {
    return (this as any)[prop];
  }

  protected _addProperties(o: HTMLElement, stringProps: string[], numProps: string[] = []) {
    const fireChange = (prop: string) => {
      if (this._connected) {
        o.dispatchEvent(new PropChangeEvent(prop));
      }
    };
    for (const prop of stringProps) {
      this._properties.add(prop);
      Object.defineProperty(o, prop, {
        get() { return (o as any)[`__${prop}`] as string; },
        set(value: string) {
          if (value !== (o as any)[`__${prop}`]) {
            (o as any)[`__${prop}`] = value;
            fireChange(prop);
          }
        },
        enumerable: true,
        configurable: true,
      });
    }
    for (const prop of numProps) {
      this._properties.add(prop);
      Object.defineProperty(o, prop, {
        get() { return (o as any)[`__${prop}`] as number; },
        set(value: number | string) {
          if (value !== (o as any)[`__${prop}`]) {
            (o as any)[`__${prop}`] = +value;
            fireChange(prop);
          }
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  connectedCallback(): void {
    this._connected = true;
    this.dispatchEvent(new Event('area-add', { bubbles: true, composed: true }));
  }

  disconnectedCallback(): void {
    this._connected = false;
  }

  abstract computeAreas(): AreaDetails[];
}