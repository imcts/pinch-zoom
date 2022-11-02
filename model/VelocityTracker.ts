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
