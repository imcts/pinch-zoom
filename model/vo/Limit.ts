import Pointer from './Pointer';

export default class Limit {
  public static of(wrapper: HTMLElement, content: HTMLElement) {
    return new Limit(wrapper, content);
  }

  private constructor(
    private readonly wrapper: HTMLElement,
    private readonly content: HTMLElement,
  ) {}

  public getBoundaryPointer() {
    const { wrapper, content } = this.getBoundingClientRects();
    return Pointer.value(
      this.calculateBoundaryCoordinate(wrapper.width, content.width),
      this.calculateBoundaryCoordinate(wrapper.height, content.height),
    );
  }

  private getBoundingClientRects() {
    return {
      wrapper: this.wrapper.getBoundingClientRect(),
      content: this.content.getBoundingClientRect(),
    };
  }

  private calculateBoundaryCoordinate(
    wrapperLength: number,
    contentLength: number,
  ) {
    return Math.abs(
      (Math.round(contentLength) - Math.round(wrapperLength)) / 2,
    );
  }

  public isDraggable() {
    const { wrapper, content } = this.getBoundingClientRects();
    return {
      x: wrapper.width < content.width,
      y: wrapper.height < content.height,
    };
  }

  public isAvailableKinect() {
    const { x, y } = this.isDraggable();
    return x || y;
  }
}
