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
  }

  private start(e: TouchEvent) {
    for (const touch of Array.from(e.changedTouches)) {
      if (this.isMaximumTouchedFinger()) {
        break;
      }
      const pointer = Pointer.touch(touch);
      const { id } = pointer;
      this.last.set(id, pointer);
      this.current.set(id, pointer);
      this.tracker.track();
      this.listener.start(pointer);
    }
  }

  private isMaximumTouchedFinger() {
    return this.current.getSize() === EventListener.MAXIMUM_FINGER;
  }

  private move(e: TouchEvent) {
    const pointers = Pointers.new();
    for (const touch of Array.from(e.changedTouches)) {
      const changed = Pointer.touch(touch);
      const current = this.current.get(changed.id);
      if (!current) {
        continue;
      }
      pointers.append(current, changed);
      this.last.set(current.id, current);
      this.current.set(changed.id, changed);
    }
    if (pointers.isEmpty()) {
      return;
    }
    this.listener.move(pointers);
  }

  private end(e: TouchEvent) {
    const pointers = this.getPointers();
    for (const touch of Array.from(e.changedTouches)) {
      const pointer = Pointer.touch(touch);
      const { id } = pointer;
      this.last.delete(id);
      this.current.delete(id);
    }
    if (this.isTouching()) {
      return;
    }
    this.listener.end(
      pointers.getChangedDistancePointer(),
      this.tracker.halt(),
    );
  }

  private isTouching() {
    return this.last.getSize() || this.current.getSize();
  }

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

  public getLastMovedPointer() {
    return this.getPointers().getChangedDistancePointer();
  }

  private getPointers() {
    const pointers = Pointers.new();
    this.last.forEachPair(this.current, (last, current) => {
      pointers.append(last, current);
    });
    return pointers;
  }
}
