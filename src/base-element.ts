/* eslint-disable @typescript-eslint/no-explicit-any */

import { PropChangeEvent } from './prop-change-event';
import { AreaDetails, VennBaseElement } from './interfaces.js';

interface PendingEventListener {
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions
}

export abstract class VennElement extends HTMLElement implements VennBaseElement {
  private _properties = new Set<string>();
  protected _connected = false;
  private _svgNode?: SVGElement;
  private _pendingEventListeners: PendingEventListener[] = [];

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

  protected _firePropChange = (prop: string) => {
    if (this._connected) {
      this.dispatchEvent(new PropChangeEvent(prop));
    }
  };

  protected _addProperties(o: HTMLElement, stringProps: string[], numProps: string[] = []) {
    const fireChange = (prop: string) => this._firePropChange(prop);
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

  private _addPendingSvgListeners() {
    if (this._svgNode) {
      for (const pl of this._pendingEventListeners) {
        this._svgNode.addEventListener(pl.type, pl.listener, pl.options);
      }
      this._pendingEventListeners = [];
    }
  }

  setSvgNode(node: SVGElement): void {
    this._svgNode = node;
    this._addPendingSvgListeners();
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    this._pendingEventListeners.push({ type, listener, options });
    this._addPendingSvgListeners();
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    if (this._svgNode) {
      this._svgNode.removeEventListener(type, listener, options);
    }
  }

  abstract computeAreas(): AreaDetails[];
}