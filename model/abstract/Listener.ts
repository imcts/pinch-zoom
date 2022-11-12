import Pointer from '../vo/Pointer';
import Pointers from '../Pointers';
import Scale from "../vo/Scale";
import Velocity from '../vo/Velocity';

export default interface Listener {
  start(): void;
  move(pointers: Pointers): void;
  end(pointer: Pointer, velocity: Velocity): void;
  wheel(pointers: Pointers, changed: Scale): void;
}

