import { action, makeObservable, observable } from 'mobx';
import { Nullable } from '../type/Nullable';

export default class LinkedSet<E> {
  public static from<E>(array: Array<E>) {
    return new LinkedSet<E>(new Set(array));
  }

  public static new<E>() {
    return new LinkedSet<E>(new Set());
  }

  @observable private readonly _set: Set<E>;
  private _tail: Nullable<E>;

  private constructor(set: Set<E>) {
    this._set = set;
    this._tail = null;
    makeObservable(this);
    Object.seal(this);
  }

  public [Symbol.iterator]() {
    return this.iterator();
  }

  public *iterator() {
    for (const element of this.set) {
      yield element;
    }
  }

  public forEach(f: (value: E) => void) {
    for (const element of this) {
      f(element);
    }
  }

  public find(f: (value: E) => boolean): Nullable<E> {
    for (const element of this) {
      if (f(element)) {
        return element;
      }
    }
    return null;
  }

  public map<R>(f: (value: E) => R): Array<R> {
    const accumulator: any = [];
    for (const element of this) {
      accumulator.push(f(element));
    }
    return accumulator;
  }

  public filter(f: (value: E) => boolean): Array<E> {
    const elements: Array<E> = [];
    for (const element of this) {
      if (f(element)) {
        elements.push(element);
      }
    }
    return elements;
  }

  public reduce<T>(f: (accumulator: T, value: E) => T, initialValue: T): T {
    return this.toArray().reduce(f, initialValue);
  }

  public reduceValues(f: (v1: E, v2: E) => E): E {
    return this.toArray().reduce(f);
  }

  public every(f: (value: E) => boolean): boolean {
    for (const element of this) {
      if (!f(element)) {
        return false;
      }
    }
    return true;
  }

  @action.bound
  public append(element: E) {
    if (this.set.has(element)) {
      return;
    }
    this.set.add((this.tail = element));
  }

  @action
  public appendFrom(iterable: Iterable<E>) {
    for (const element of iterable) {
      this.append(element);
    }
  }

  public getFirstElement(): Nullable<E> {
    if (this.isEmpty()) {
      return null;
    }
    return this.iterator().next().value as E;
  }

  public getLastElement(): Nullable<E> {
    return this.tail ?? null;
  }

  public isNotEmpty() {
    return !this.isEmpty();
  }

  public isEmpty() {
    return !this.set.size;
  }

  @action
  public clear() {
    this.set.clear();
    this.tail = null;
    return this;
  }

  public has(element: E) {
    return this.set.has(element);
  }

  @action.bound
  public delete(element: E) {
    this.set.delete(element);
    this.updateTail(element);
  }

  private updateTail(deletedElement: E) {
    if (this.isEmpty()) {
      this.tail = null;
    } else {
      if (this.tail === deletedElement) {
        const elements = this.toArray();
        this.tail = elements[elements.length - 1];
      }
    }
  }

  public getSize() {
    return this.set.size;
  }

  public copy() {
    const copied = LinkedSet.from<E>(this.toArray());
    copied.tail = this.tail;
    return copied;
  }

  public slice(count: number) {
    const result = [];
    let loop = 0;
    for (const element of this) {
      if (loop < count) {
        result.push(element);
      } else {
        break;
      }
      loop += 1;
    }
    return result;
  }

  public sliceFromTo(from: number, to: number) {
    const result = [];
    let index = 0;
    for (const element of this) {
      if (index >= from && index <= to) {
        result.push(element);
      }
      index += 1;
    }
    return result;
  }

  private get set(): Set<E> {
    return this._set;
  }

  private get tail(): Nullable<E> {
    return this._tail;
  }

  private set tail(value: Nullable<E>) {
    this._tail = value;
  }

  public toArray() {
    return [...this];
  }
}
