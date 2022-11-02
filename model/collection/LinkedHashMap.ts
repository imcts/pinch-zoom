import { action, makeObservable, observable } from 'mobx';

export default class LinkedHashMap<K, V> {
  public static new<K, V>() {
    return new LinkedHashMap<K, V>(new Map());
  }

  public static from<K, V>(data: Array<[K, V]>) {
    return new LinkedHashMap<K, V>(new Map(data));
  }

  @observable private readonly hashMap: Map<K, V>;

  private constructor(hashMap: Map<K, V>) {
    this.hashMap = hashMap;
    makeObservable(this);
  }

  @action
  public clear() {
    this.hashMap.clear();
    return this;
  }

  @action
  public delete(key: K) {
    return this.hashMap.delete(key);
  }

  @action
  public set(key: K, value: V) {
    this.hashMap.set(key, value);
    return value;
  }

  public has(key: K) {
    return this.hashMap.has(key);
  }

  public get(key: K) {
    return this.hashMap.get(key);
  }

  @action
  public setAll(data: Array<[K, V]>) {
    data.forEach(([key, value]) => this.set(key, value));
  }

  public filter(f: (key: K, value: V) => boolean): Array<[K, V]> {
    const filtered: Array<[K, V]> = [];
    for (const [key, value] of this.hashMap) {
      if (f(key, value)) {
        filtered.push([key, value]);
      }
    }
    return filtered;
  }

  public map<R>(f: (key: K, value: V) => R): Array<R> {
    const mapped = [];
    for (const [key, value] of this.hashMap) {
      mapped.push(f(key, value));
    }
    return mapped;
  }

  public isEmpty() {
    return !this.getSize();
  }

  public getSize() {
    return this.hashMap.size;
  }

  public getValuesAsArray() {
    return Array.from(this.hashMap.values());
  }

  public getFirstValue() {
    return this.getValuesAsArray()[0];
  }

  public reduce<T>(f: (accumulator: T, value: V) => T, initialValue: T): T {
    return Array.from(this.hashMap.values()).reduce(f, initialValue);
  }

  public reduceValues(f: (v1: V, v2: V) => V): V {
    return Array.from(this.hashMap.values()).reduce(f);
  }

  public forEachPair(
    map: LinkedHashMap<K, V>,
    f: (v1: V, v2: V) => void,
  ): void {
    if (!map.getSize()) {
      throw new TypeError('There is no way to compare. the map is empty.');
    }
    const thisValues = this.getValuesAsArray();
    const targetValues = map.getValuesAsArray();
    for (let i = 0, length = this.getSize(); i < length; i++) {
      f(thisValues[i], targetValues[i]);
    }
  }
}
