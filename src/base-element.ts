/* eslint-disable @typescript-eslint/no-explicit-any */

import { PropChangeEvent } from './prop-change-event';
import { AreaDetails, VennBaseElement } from './interfaces.js';

interface PendingEventListener {
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions
}

export abstract class VennElement extends HTMLElement implements VennBaseElement {
  private _connected = false;
  private _svgNode?: SVGElement;
  private _pendingEventListeners: PendingEventListener[] = [];
  protected _size = 0;
  private _label = '';

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    if (value !== this._size) {
      this._size = value;
      this._firePropChange('size');
    }
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

  attributeChangedCallback(name: string, _: string, newValue: string) {
    (this as any)[name] = newValue;
  }

  protected _firePropChange = (prop: string) => {
    if (this._connected) {
      this.dispatchEvent(new PropChangeEvent(prop));
    }
  };

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