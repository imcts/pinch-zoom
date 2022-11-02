import Pointer from './Pointer';

export default class NonePointer extends Pointer {
  public constructor() {
    super({ identifier: Number.MIN_SAFE_INTEGER, pageX: 0, pageY: 0 });
  }
}
