export enum Block {
  I = "I",
  J = "J",
  L = "L",
  O = "O",
  S = "S",
  T = "T",
  Z = "Z",
}

export type BlockShape = boolean[][];

export enum CellEmpty {
  Empty = "Empty",
}

export type CellOptions = Block | CellEmpty;

export type BoardShape = CellOptions[][];

type ShapesType = {
  [key in Block]: {
    shape: BlockShape;
  };
};

export const SHAPES: ShapesType = {
  I: {
    shape: [
      [false, false, false, false],
      [false, false, false, false],
      [true, true, true, true],
      [false, false, false, false],
    ],
  },
  J: {
    shape: [
      [false, false, false],
      [false, false, true],
      [true, true, true],
    ],
  },
  L: {
    shape: [
      [false, false, false],
      [true, false, false],
      [true, true, true],
    ],
  },
  O: {
    shape: [
      [true, true],
      [true, true],
    ],
  },
  S: {
    shape: [
      [false, false, false],
      [false, true, true],
      [true, true, false],
    ],
  },
  T: {
    shape: [
      [false, false, false],
      [false, true, false],
      [true, true, true],
    ],
  },
  Z: {
    shape: [
      [false, false, false],
      [true, true, false],
      [false, true, true],
    ],
  },
};

// Game speed constants in milliseconds
export enum Speed {
  Normal = 800,
  Fast = 400,
  Faster = 200,
  Slide = 100,
}

export type Room = {
  id: string;
  roomName: string;
  players: string[];
};
