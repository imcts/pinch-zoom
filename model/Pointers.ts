import LinkedSet from './collection/LinkedSet';
import NonePointer from './vo/NonePointer';
import NoneScale from './vo/NoneScale';
import Pointer from './vo/Pointer';
import Scale from './vo/Scale';

export default class Pointers {
  public static new() {
    return new Pointers();
  }

  private readonly currentPointers: LinkedSet<Pointer>;
  private readonly changedPointers: LinkedSet<Pointer>;

  private constructor() {
    this.currentPointers = LinkedSet.new();
    this.changedPointers = LinkedSet.new();
  }

  public append(current: Pointer, changed: Pointer) {
    this.currentPointers.append(current);
    this.changedPointers.append(changed);
  }

  public isEmpty() {
    return this.currentPointers.isEmpty() || this.changedPointers.isEmpty();
  }

  public getChangedDistancePointer() {
    if (this.isEmpty()) {
      return new NonePointer();
    }
    const current = this.getCurrentMidPointer();
    const changed = this.getChangedMidPointer();
    return changed.minus(current);
  }

  private getCurrentMidPointer() {
    return this.getMidPointer(this.currentPointers);
  }

  private getMidPointer(pointers: LinkedSet<Pointer>) {
    return pointers.reduceValues((p1, p2) => p1.getMidPointer(p2));
  }

  private getChangedMidPointer() {
    return this.getMidPointer(this.changedPointers);
  }

  public getChangedScale() {
    if (this.isEmpty()) {
      return new NoneScale();
    }
    const ratio = this.getChangedDistance() / this.getCurrentDistance();
    if (Number.isNaN(ratio)) {
      return new NoneScale();
    }
    return Scale.from(ratio);
  }

  private getCurrentDistance() {
    return this.getDistance(this.currentPointers);
  }

  private getDistance(pointers: LinkedSet<Pointer>) {
    const size = pointers.getSize();
    if (size === 1) {
      return 0;
    }
    for (let i = 0, distance = 0; i < size; i++) {
      const [first, second] = pointers.sliceFromTo(i, i + 1);
      if (!second) {
        return distance;
      }
      distance += Math.sqrt(
        (second.x - first.x) ** 2 + (second.y - first.y) ** 2,
      );
    }
    return 0;
  }

  private getChangedDistance() {
    return this.getDistance(this.changedPointers);
  }

  public getChangedTouchPoint() {
    return this.getChangedMidPointer();
  }
}
