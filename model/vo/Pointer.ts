import Limit from './Limit';
import Velocity from './Velocity';

interface Data {
  identifier: number;
  pageX: number;
  pageY: number;
}

export default class Pointer {
  private static readonly KINETIC_DISTANCE = 100;
  private static readonly KINETIC_FRICTION = 0.7;
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
}
