export default class Time {
  private static readonly KINETIC_TIME = 325;
  private static readonly MINIMUM_FACTOR = 0.01;

  public static isBiggerThanMinimumFactor(factor: number) {
    return factor > this.MINIMUM_FACTOR;
  }

  public static now() {
    return this.from(Date.now());
  }

  private static from(time: number) {
    return new Time(time);
  }

  private constructor(public readonly time: number) {}

  public getElapsed() {
    return Time.from(this.getElapsedTime());
  }

  private getElapsedTime() {
    return 1 + Date.now() - this.time;
  }

  /**
   * @see: https://developer.apple.com/documentation/uikit/uiscrollview#/apple_ref/doc/c_ref/UIScrollViewDecelerationRateNormal
   */
  public getElapsedFactor() {
    return Math.exp(-this.getElapsedTime() / Time.KINETIC_TIME);
  }
}
