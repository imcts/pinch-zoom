export default class Scale {
  private static readonly MINIMUM_RATIO = 1;

  public static from(ratio: number) {
    return new Scale(ratio);
  }

  protected constructor(public readonly ratio: number) {}

  public multiply(scale: Scale) {
    if (this.isLessThanMinimum(this.ratio * scale.ratio)) {
      return Scale.from(Scale.MINIMUM_RATIO);
    } else {
      return Scale.from(this.ratio * scale.ratio);
    }
  }

  private isLessThanMinimum(ratio: number) {
    return ratio < Scale.MINIMUM_RATIO;
  }

  public isMinimum() {
    return this.ratio === Scale.MINIMUM_RATIO;
  }
}
