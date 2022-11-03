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

  /**
   * @information
   *  - 현재 위치 포인터들의 중간점을 구합니다.
   *  - 사용자가 이동한 포인터들의 중간점을 구합니다.
   *  - 두 포인터의 거리를 구하여 사용자가 이동한 거리를 구합니다.
   */
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

  /**
   * @information
   *  - 사용자가 터치하고 있던 위치들의 거리를 구합니다.
   *  - 사용자가 확대 또는 축소한 위치들의 거리를 구합니다.
   *  - 사용자가 터치하고 있던 위치들의 거리 대비, 얼만큼 늘어나거나 줄어 들었는지 비율을 구합니다.
   *
   * @example
   *  - 터치 시작 시 첫 번째 손가락 위치 a(10, 10), b(50,50)
   *  - 줌인 시 첫 번째 손가락 위치 a(10, 10), b(100, 100)
   *  - 피타고라스의 정의 직각삼각형의 빗변의 길이 공식을 활용 합니다.
   *    - a ** 2 + b ** 2 === c ** 2
   *  - 시작 시 a좌표에서 b좌표까지의 거리를 구합니다.
   *  - 줌인 시 a좌표에서 b좌표까지의 거리를 구합니다.
   *  - 루트(변경된 거리 / 시작시 거리) === 변경된 비율
   */
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
