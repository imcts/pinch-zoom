import Pointer from '../vo/Pointer';
import Pointers from '../Pointers';
import Velocity from '../vo/Velocity';

export default interface Listener {
  start(pointer: Pointer): void;
  move(pointers: Pointers): void;
  end(pointer: Pointer, velocity: Velocity): void;
}