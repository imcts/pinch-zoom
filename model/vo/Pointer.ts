import Limit from './Limit';
import Velocity from './Velocity';

interface Data {
  identifier: number;
  pageX: number;
  pageY: number;
}

export default class Pointer {
  private static readonly KINETIC_DISTANCE = 100;
  private static readonly KINETIC_FRICTION = 0.6;
  private static readonly DEFAULT_POINTER = 0;

  public static touch(data: Data) {
    return new Pointer(data);
  }

  public static value(x: number, y: number) {
    return this.of(Number.MIN_SAFE_INTEGER, x, y);
  }

  private static of(identifier: number, pageX: number, pageY: number) {
    return new Pointer({
      identifier,
      pageX,
      pageY,
    });
  }

  public readonly id: number;
  public readonly x: number;
  public readonly y: number;

  protected constructor(data: Data) {
    this.id = data.identifier;
    this.x = data.pageX;
    this.y = data.pageY;
  }

  public getMidPointer({ x, y }: Pointer) {
    return Pointer.of(this.id, (this.x + x) / 2, (this.y + y) / 2);
  }

  public plus({ x, y }: Pointer) {
    return Pointer.of(this.id, this.x + x, this.y + y);
  }

  public minus({ x, y }: Pointer) {
    return Pointer.of(this.id, this.x - x, this.y - y);
  }

  /**
   * @param kinetic: 사용자가 마지막으로 이동한 거리를 기반으로한 관성 이동할 거리 입니다.
   * @param limit: 제약 조건을 담당하는 객체 입니다.
   *
   * @information
   *  - 현재 위치에 관성 거리를 더하여 목적지를 구합니다.
   *  - 리미트 객체로부터 바운더리를 구합니다.
   *  - 리미트 객체로부터 드래그 할 수 있는지 여부를 구합니다.
   *  - 드래그 할 수 없다면, 좌표값은 기본값으로 설정 합니다.
   *  - 바운더리 위치에 제한된다면, 관성 이동 되어야 하는 거리는 현재 위치에서 바운더리 까지 입니다.
   *  - 바운더리 위치에 제한되지 않는다면 관성 이동 거리를 반환 합니다.
   */
  public getBoundedKineticPointer(kinetic: Pointer, limit: Limit) {
    const destination = this.plus(kinetic);
    const boundary = limit.getBoundaryPointer();
    const draggable = limit.isDraggable();
    return Pointer.of(
      this.id,
      this.boundKineticCoordinate(
        kinetic.x,
        destination.x,
        boundary.x,
        this.x,
        draggable.x,
      ),
      this.boundKineticCoordinate(
        kinetic.y,
        destination.y,
        boundary.y,
        this.y,
        draggable.y,
      ),
    );
  }

  private boundKineticCoordinate(
    kinetic: number,
    destination: number,
    boundary: number,
    current: number,
    draggable: boolean,
  ) {
    if (!draggable) {
      return Pointer.DEFAULT_POINTER;
    }
    if (destination > boundary) {
      kinetic = boundary - current;
    }
    if (destination < -boundary) {
      kinetic = -(boundary + current);
    }
    return kinetic;
  }

  public getKineticPointer({ velocityX, velocityY }: Velocity) {
    return Pointer.of(
      this.id,
      this.getKineticCoordinate(this.x, velocityX),
      this.getKineticCoordinate(this.y, velocityY),
    );
  }

  private getKineticCoordinate(coordinate: number, velocity: number) {
    return (
      coordinate *
      Pointer.KINETIC_DISTANCE *
      velocity *
      Pointer.KINETIC_FRICTION
    );
  }

  public getExponentialPointer(factor: number) {
    return Pointer.of(this.id, this.x * factor, this.y * factor);
  }

  public bound(limit: Limit) {
    const boundary = limit.getBoundaryPointer();
    const draggable = limit.isDraggable();
    return Pointer.of(
      this.id,
      this.boundCoordinate(this.x, boundary.x, draggable.x),
      this.boundCoordinate(this.y, boundary.y, draggable.y),
    );
  }

  private boundCoordinate(
    coordinate: number,
    boundary: number,
    draggable: boolean,
  ) {
    if (!draggable) {
      return Pointer.DEFAULT_POINTER;
    }
    if (coordinate > boundary) {
      coordinate = boundary;
    }
    if (coordinate < -boundary) {
      coordinate = -boundary;
    }
    return coordinate;
  }

  public isEmpty() {
    return !this.x && !this.y;
  }

  public isReachedEndOfLandscape() {
    return !this.x;
  }

  public isLeft() {
    return this.isLandscape() && this.x > 0;
  }

  private isLandscape() {
    return Math.abs(this.x) > Math.abs(this.y);
  }

  public isRight() {
    return this.isLandscape() && this.x < 0;
  }
}