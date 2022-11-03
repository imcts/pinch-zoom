import { Nullable } from './type/Nullable';
import EventListener from './EventListener';
import Time from './vo/Time';
import Velocity from './vo/Velocity';

export default class VelocityTracker {
  private static readonly TRACKING_TIME = 50;

  public static from(listener: EventListener) {
    return new VelocityTracker(listener);
  }

  private time: Time;
  private velocity: Velocity;
  private tracker: Nullable<NodeJS.Timeout>;

  private constructor(private readonly listener: EventListener) {
    this.time = Time.now();
    this.velocity = Velocity.new();
    this.tracker = null;
  }

  /**
   * @information
   *  - 기존의 속도 추적을 종료 합니다.
   *  - 타이머를 초기화 합니다.
   *  - 50 m/s 마다 함수를 수행하여 사용자의 속도를 추적 합니다.
   *  - 타이머를 초기화 하여 다음 함수 실행에 대비 합니다.
   */
  public track() {
    this.halt();
    this.resetTime();
    this.tracker = setInterval(() => {
      this.velocity = this.velocity.track(
        this.listener.getLastMovedPointer(),
        this.time.getElapsed(),
      );
      this.resetTime();
    }, VelocityTracker.TRACKING_TIME);
  }

  private resetTime() {
    this.time = Time.now();
  }

  /**
   * @information
   *  - 속도 추적을 종료 하고 현재 속도를 반환 합니다.
   */
  public halt() {
    if (!this.tracker) {
      return this.velocity.get();
    }
    clearInterval(this.tracker);
    this.tracker = null;
    return this.velocity.get();
  }

  public clear() {
    this.time = Time.now();
    this.velocity = Velocity.new();
    this.tracker = null;
  }
}
