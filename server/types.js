module.exports = {
  Block: {
    I: "I",
    J: "J",
    L: "L",
    O: "O",
    S: "S",
    T: "T",
    Z: "Z",
  },

  SHAPES: {
    I: {
      shape: [
        [false, false, false, false],
        [true, true, true, true],
        [false, false, false, false],
        [false, false, false, false],
      ],
    },
    J: {
      shape: [
        [true, false, false],
        [true, true, true],
        [false, false, false],
      ],
    },
    L: {
      shape: [
        [false, false, true],
        [true, true, true],
        [false, false, false],
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
        [false, true, true],
        [true, true, false],
        [false, false, false],
      ],
    },
    T: {
      shape: [
        [false, true, false],
        [true, true, true],
        [false, false, false],
      ],
    },
    Z: {
      shape: [
        [true, true, false],
        [false, true, true],
        [false, false, false],
      ],
    },
  },

  CellEmpty: "Empty",

  Speed: {
    Normal: 800,
    Fast: 400,
    Faster: 200,
    Slide: 100,
  },
};
