import EventListener from './EventListener';
import Listener from './abstract/Listener';
import Pointers from './Pointers';
import Limit from './vo/Limit';
import NonePointer from './vo/NonePointer';
import NoneScale from './vo/NoneScale';
import Pointer from './vo/Pointer';
import Scale from './vo/Scale';
import Time from './vo/Time';
import Velocity from './vo/Velocity';

export default class PinchZoom implements Listener {
  private readonly event: EventListener;
  private readonly limit: Limit;
  private animator: number;

  public constructor(
    wrapper: HTMLElement,
    private readonly content: HTMLElement,
  ) {
    this.event = EventListener.of(wrapper, this);
    this.limit = Limit.of(wrapper, content);
    this.animator = 0;
  }

  public run() {
    this.event.run();
    return this;
  }

  public start() {
    this.cancelAnimation();
  }

  private cancelAnimation() {
    cancelAnimationFrame(this.animator);
  }

  public move(pointers: Pointers) {
    const { scale, pointer } = this.getCurrentStatus();
    const changedScale = pointers.getChangedScale();
    const newScale = scale.multiply(changedScale);
    this.render(
      pointer
        .plus(pointers.getChangedDistancePointer())
        .minus(this.getParallelPointer(pointers, changedScale))
        .bound(this.limit),
      newScale,
    );
  }

  private getCurrentStatus() {
    const style = window.getComputedStyle(this.content);
    const matrix =
      style['transform'] || style['webkitTransform'] || style['mozTransform'];
    if (!matrix || matrix === 'none') {
      return {
        scale: new NoneScale(),
        pointer: new NonePointer(),
      };
    }
    const matches = matrix.match(/matrix\((.+)\)/);
    if (!matches) {
      return {
        scale: new NoneScale(),
        pointer: new NonePointer(),
      };
    }
    const [, matched] = matches;
    const values = matched.split(',');
    return {
      scale: Scale.from(+values[0]),
      pointer: Pointer.value(+values[4], +values[5]),
    };
  }

  private getParallelPointer(pointers: Pointers, { ratio }: Scale) {
    const { x, y } = pointers.getChangedTouchPoint();
    const { left, top, width, height } = this.content.getBoundingClientRect();
    return Pointer.value(
      this.calculateParallelCoordinate(width, left, x, ratio),
      this.calculateParallelCoordinate(height, top, y, ratio),
    );
  }

  private calculateParallelCoordinate(
    length: number,
    current: number,
    changed: number,
    ratio: number,
  ) {
    const center = length / 2 + current;
    const currentDistance = changed - center;
    const changedDistance = currentDistance * ratio;
    return changedDistance - currentDistance;
  }

  private render({ x, y }: Pointer, { ratio }: Scale) {
    this.content.style.transform = `translate(${x}px, ${y}px) scale(${ratio})`;
  }

  public end(last: Pointer, velocity: Velocity) {
    if (!this.limit.isAvailableKinect()) {
      return;
    }
    const { scale, pointer } = this.getCurrentStatus();
    const kinetic = pointer.getBoundedKineticPointer(
      last.getKineticPointer(velocity),
      this.limit,
    );
    this.animate(kinetic, pointer.plus(kinetic), scale);
  }

  private animate(kinetic: Pointer, destination: Pointer, scale: Scale) {
    const startTime = Time.now();
    const f = () => {
      const factor = startTime.getElapsedFactor();
      if (Time.isBiggerThanMinimumFactor(factor)) {
        this.render(
          destination.minus(kinetic.getExponentialPointer(factor)),
          scale,
        );
        this.animator = requestAnimationFrame(f);
      } else {
        this.render(destination, scale);
      }
    };
    this.animator = requestAnimationFrame(f);
  }

  public clear() {
    this.event.clear();
  }
}
