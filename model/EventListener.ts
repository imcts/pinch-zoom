import LinkedHashMap from './collection/LinkedHashMap';
import Listener from './abstract/Listener';
import Pointer from './vo/Pointer';
import Pointers from './Pointers';
import VelocityTracker from './VelocityTracker';
import Scale from "./vo/Scale";

export default class EventListener {
  private static readonly MAXIMUM_FINGER = 2;
  private static readonly WHEEL_DIVIDER = 500;

  public static of(wrapper: HTMLElement, listener: Listener) {
    return new EventListener(wrapper, listener);
  }

  private readonly touchEvent: LinkedHashMap<string, (e: TouchEvent) => void>;
  private readonly wheelEvent: LinkedHashMap<string, (e: Event) => void>;
  private readonly last: LinkedHashMap<number, Pointer>;
  private readonly current: LinkedHashMap<number, Pointer>;
  private readonly tracker: VelocityTracker;
  private fingerCount: number;

  private constructor(
    private readonly wrapper: HTMLElement,
    private readonly listener: Listener,
  ) {
    this.touchEvent = LinkedHashMap.from([
      ['start', (e) => this.start(e)],
      ['move', (e) => this.move(e)],
      ['end', (e) => this.end(e)],
    ]);
    this.wheelEvent = LinkedHashMap.from([
      ['wheel', (e) => this.wheel(e as WheelEvent)],
    ]);
    this.current = LinkedHashMap.new();
    this.last = LinkedHashMap.new();
    this.tracker = VelocityTracker.from(this);
    this.fingerCount = 0;
  }

  /**
   * @information
   *  - 사용자가 이동한 터치 이벤트를 순회 합니다.
   *  - 이미 터치한 손가락이 2개라면 메서드를 종료 합니다.
   *  - 터치 이벤트를 기반으로 Pointer객체를 생성하고, 마지막 위치와 현재 위치에 저장 합니다.
   *  - 사용자가 터치를 시작했으므로 속도를 추적 합니다.
   *  - 이벤트 구독자의 start 메서드에 현재 터치된 포인터를 전달 합니다.
   */
  private start(e: TouchEvent) {
    this.updateFingerCount(e);
    for (const touch of Array.from(e.changedTouches)) {
      if (this.isMaximumTouchedFinger()) {
        break;
      }
      if (!this.isTouching()) {
        this.listener.start();
      }
      const pointer = Pointer.touch(touch);
      const { id } = pointer;
      this.last.set(id, pointer);
      this.current.set(id, pointer);
      this.tracker.track();
    }
  }

  private updateFingerCount(e: TouchEvent) {
    this.fingerCount = e.touches.length;
  }

  private isMaximumTouchedFinger() {
    return this.current.getSize() === EventListener.MAXIMUM_FINGER;
  }

  /**
   * @information
   *  - 터치 이벤트를 담을 Pointers를 생성 합니다.
   *  - 이벤트에서 좌표가 변경된 이벤트만 꺼내서, 기존에 등록한 적이 있는 이벤트인지 확인 합니다.
   *  - 터치 스타트에서 등록 되지 않은 새로운 터치 이벤트라면 무시합니다.
   *  - Pointers에 이전 포인터와 변경된 포인터로 저장 합니다.
   *  - 마지막 포인터 위치와 현재 포인터 위치로 새로 저장 합니다.
   *  - Pointers가 비어 있다면, 터치가 시작된 적이 없으므로 무시 합니다.
   *  - 이벤트 구독자의 move 메서드를 호출 합니다.
   */
  private move(e: TouchEvent) {
    const pointers = Pointers.new();
    Array.from(e.changedTouches).forEach((touch) => {
      const changed = Pointer.touch(touch);
      const current = this.current.get(changed.id);
      if (!current) {
        return;
      }
      pointers.append(current, changed);
      this.last.set(current.id, current);
      this.current.set(changed.id, changed);
    });
    if (pointers.isEmpty()) {
      return;
    }
    this.listener.move(pointers);
  }

  /**
   * @information
   *  - 마지막 위치 정보와, 현재 위치 정보를 담고 있는 Pointers를 구합니다.
   *  - 사용자가 종료한 터치 이벤트의 아이디를 기반으로 저장하고 있던 위치 정보를 제거 합니다.
   *  - 사용자가 터치를 지속중이라면 메서드를 종료 합니다.
   *  - 사용자의 드래그 속도 추적을 종료 합니다.
   *  - 이벤트 구독자의 end메서드를 호출하고 저장하고 있던 마지막 위치 정보들을 전달 합니다.
   */
  private end(e: TouchEvent) {
    this.updateFingerCount(e);
    const last = this.getLastMovedPointer();
    for (const touch of Array.from(e.changedTouches)) {
      const { id } = Pointer.touch(touch);
      this.last.delete(id);
      this.current.delete(id);
    }
    if (this.isTouching()) {
      return;
    }
    this.listener.end(last, this.tracker.halt());
  }

  public getLastMovedPointer() {
    const pointers = Pointers.new();
    this.last.forEachPair(this.current, (last, current) => {
      pointers.append(last, current);
    });
    return pointers.getChangedDistancePointer();
  }

  private isTouching() {
    return this.last.getSize() || this.current.getSize();
  }

  /**
   * @information
   *  - PC 환경에서 마우스 휠로 줌 인/아웃 할 수 있도록 구성 합니다.
   *  - 사용자가 이동한 마우스 휠 거리를 상수로 나누어 이동한 거리를 구합니다.
   *  - 이벤트 구독자의 wheel메서드를 호출하고, 사용자의 마우스 위치 정보와 변경된 줌 비율을 전달 합니다.
   */
  private wheel(e: WheelEvent) {
    const pointers = Pointers.new();
    const pointer = Pointer.value(e.x, e.y);
    pointers.append(pointer, pointer);
    this.listener.wheel(
      pointers,
      Scale.from(1 - e.deltaY / EventListener.WHEEL_DIVIDER),
    );
  }

  public run() {
    this.removeEvent();
    this.addEvent();
  }

  private removeEvent() {
    this.wrapper.removeEventListener('touchstart', this.getTouchEvent('start'));
    this.wrapper.removeEventListener('mousewheel', this.getWheelEvent('wheel'));
    this.wrapper.removeEventListener('touchmove', this.getTouchEvent('move'));
    this.wrapper.removeEventListener('touchend', this.getTouchEvent('end'));
    this.wrapper.removeEventListener('touchcancel', this.getTouchEvent('end'));
  }

  private getTouchEvent(key: string): (e: TouchEvent) => void {
    return this.getCallback(key, this.touchEvent);
  }

  private getWheelEvent(key: string): (e: Event) => void {
    return this.getCallback(key, this.wheelEvent);
  }

  private getCallback<
    E extends Event,
    T extends LinkedHashMap<string, (e: E) => void>
    >(key: string, m: T) {
    const callback = m.get(key);
    if (!callback) {
      throw new TypeError(`There is no event callback. key=${key}`);
    }
    return callback;
  }

  private addEvent() {
    this.wrapper.addEventListener('touchstart', this.getTouchEvent('start'));
    this.wrapper.addEventListener('mousewheel', this.getWheelEvent('wheel'));
    this.wrapper.addEventListener('touchmove', this.getTouchEvent('move'));
    this.wrapper.addEventListener('touchend', this.getTouchEvent('end'));
    this.wrapper.addEventListener('touchcancel', this.getTouchEvent('end'));
  }

  public clear() {
    this.removeEvent();
    this.touchEvent.clear();
    this.touchEvent.clear();
    this.last.clear();
    this.current.clear();
    this.tracker.clear();
  }

  public isSingleTouch() {
    return this.fingerCount === 1;
  }
}