import Pointer from './Pointer';

export default class Limit {
  public static of(wrapper: HTMLElement, content: HTMLElement) {
    return new Limit(wrapper, content);
  }

  private constructor(
    private readonly wrapper: HTMLElement,
    private readonly content: HTMLElement,
  ) {}

  /**
   * @information
   *  - 컨텐츠가 이동할 수 있는 최대 좌표값을 반환 합니다.
   */
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

  /**
   * @information
   *  - 컨텐츠가 래퍼보다 커야만 x축, y축으로 이동할 수 있습니다.
   */
  public isDraggable() {
    const { wrapper, content } = this.getBoundingClientRects();
    return {
      x: wrapper.width < content.width,
      y: wrapper.height < content.height,
    };
  }

  /**
   * @information
   *  - 관성 이동은 어느 방향으로든 컨텐츠가 이동할 수 있어야 합니다.
   */
  public isAvailableKinect() {
    const { x, y } = this.isDraggable();
    return x || y;
  }
}
