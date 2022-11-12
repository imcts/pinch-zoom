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
  private readonly reached: LinkedHashMap<string, boolean>;
  private animator: number;

  public constructor(
    wrapper: HTMLElement,
    private readonly content: HTMLElement,
  ) {
    this.event = EventListener.of(wrapper, this);
    this.limit = Limit.of(wrapper, content);
    this.reached = LinkedHashMap.from([
      ['top', false],
      ['left', false],
    ]);
    this.animator = 0;
  }

  public run() {
    this.event.run();
    return this;
  }

  public start() {
    this.cancelAnimation();
    this.updateReached();
  }

  private updateReached() {
    const {
      pointer: { x },
    } = this.getCurrentStatus();
    const limit = this.limit.getBoundaryPointer();
    this.reached.set('left', x === limit.x);
    this.reached.set('right', x === -limit.x);
  }

  /**
   * @information
   *  - 현재 진행중인 애니메이션이 있다면 취소 합니다.
   */
  private cancelAnimation() {
    cancelAnimationFrame(this.animator);
  }

  /**
   * @param pointers: 사용자가 이전에 터치한 위치 정보들과, 현재 이동한 위치 정보들을 담고 있습니다.
   * @information
   *  - content의 현재 확대정보와, 위치정보를 구합니다.
   *  - pointers에서 사용자가 변경한 Scale정보를 얻고, 기존 Scale과 곱하여 변경될 Scale을 구합니다.
   *  - 사용자가 이동한 위치들의 중점의 위치를 구하고, 현재 위치에 더합니다.
   *  - 사용자가 변경한 위치들과, 변경한 확대 비율 정보로 평행 이동해야 하는 위치를 구합니다.
   *  - 평행 이동해야 하는 위치를 현재 위치에서 빼주어서, 줌 인/아웃 시 한 지점에서 머무르도록 합니다.
   *  - 사용자가 화면을 드래그 시 wrapper를 벗어나지 않도록 바운딩 처리를 합니다.
   */
  public move(pointers: Pointers) {
    const { scale, pointer } = this.getCurrentStatus();
    const changedScale = pointers.getChangedScale();
    const changedPointer = pointers.getChangedDistancePointer();
    const newScale = scale.multiply(changedScale);
    this.expireReachedEvent(changedPointer);
    this.render(
      pointer
      .plus(changedPointer)
      .minus(this.getParallelPointer(pointers, changedScale))
      .bound(this.limit),
      newScale,
    );
  }

  private expireReachedEvent(pointer: Pointer) {
    if (this.event.isSingleTouch()) {
      if (this.reached.get('left') && pointer.isLeft()) {
        console.log('left');
      } else if (this.reached.get('right') && pointer.isRight()) {
        console.log('right');
      }
    }
    this.reached.set('left', false);
    this.reached.set('right', false);
  }

  /**
   * @see: https://developer.mozilla.org/en-US/docs/Web/CSS/transform#syntax
   */
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

  /**
   * @param last: 사용자가 마지막에 이동시킨 포인터 입니다.
   * @param velocity: 사용자가 드래그 중에 발생시킨 속도 입니다.
   * @information
   *  - 드래그 가능한 상태가 아니라면 무시 합니다.
   *  - 사용자가 마지막에 이동시킨 거리와 속도를 기반으로 관성 이동 해야 할 거리를 구합니다.
   *  - 구해진 관성 이동 거리에 바운딩 처리를 하여 최종 이동할 거리를 구합니다.
   *  - 현재 위치에 관성이동 위치를 더해주고 애니메이션을 수행 합니다.
   */
  public end(last: Pointer, velocity: Velocity) {
    if (last.isEmpty()) {
      console.log('tab');
      return;
    }
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

  /**
   * @information
   *  - 애니메이션 시작 시간을 기록 합니다.
   *  - 경과 시간을 기준으로 오일러 상수에 지수연산을 수행하여 관성이동할 비율을 구합니다.
   *  - 관성 이동을 할 수 있다면 이동할 수 있는 거리만큼 화면을 렌더링 하고, 다시 애니메이션 함수를 수행 합니다.
   *  - 경과 시간으로 구한 관성이동 비율이 최소치에 다다랐다면, 목적지 좌표로 렌더링하고 애니메이션을 종료 합니다.
   */
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
        this.cancelAnimation();
      }
    };
    this.animator = requestAnimationFrame(f);
  }

  public wheel(pointers: Pointers, changedScale: Scale) {
    const { scale, pointer } = this.getCurrentStatus();
    const newScale = scale.multiply(changedScale);
    this.render(
      pointer
      .plus(pointers.getChangedDistancePointer())
      .minus(this.getParallelPointer(pointers, changedScale))
      .bound(this.limit),
      newScale,
    );
  }

  public clear() {
    this.event.clear();
  }
}