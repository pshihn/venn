export class PropChangeEvent extends Event {
  propName = '';

  constructor(propName: string) {
    super('prop-change', {
      cancelable: true,
      bubbles: true,
      composed: true,
    });
    this.propName = propName;
  }
}