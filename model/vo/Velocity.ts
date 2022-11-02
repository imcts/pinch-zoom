import Pointer from './Pointer';
import Time from './Time';

export default class Velocity {
  public static new() {
    return this.of(0, 0);
  }

  private static of(velocityX: number, velocityY: number) {
    return new Velocity(velocityX, velocityY);
  }

  private constructor(
    public readonly velocityX: number,
    public readonly velocityY: number,
  ) {}

  public track({ x, y }: Pointer, { time }: Time) {
    return Velocity.of(
      this.getVelocity(Math.abs(x), this.velocityX, time),
      this.getVelocity(Math.abs(y), this.velocityY, time),
    );
  }

  /**
   * @information: https://en.wikipedia.org/wiki/Moving_average
   */
  private getVelocity(v1: number, v2: number, time: number) {
    return 0.8 * (v1 / time) + 0.2 * v2;
  }

  public get() {
    return Velocity.of(this.velocityX, this.velocityY);
  }
}
