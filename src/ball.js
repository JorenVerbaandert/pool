import * as vec2 from 'gl-vec2';

export function createBall(table, color, number, col = 0, row = 0, half = false, position) {
  const x = col * 27;
  const y = row * 27;

  const startPos = position || [
    table.inner.x + 3 * (table.inner.width / 4) + x,
    table.inner.y + (table.inner.height / 2) + y,
  ];

  const ball = {
    position: vec2.fromValues(...startPos),
    get x() {
      return this.position[0];
    },
    get y() {
      return this.position[1];
    },
    z: 25/2, // TODO: from settings
    color,
    half,
    number,
    getPower: () => ball.remainingPower || ball.power,
  };
  return ball;
}

export function createBalls(table) {
  const balls = [];

  balls.push(createBall(table, 'white', 0, 0, 0, false, [
    table.inner.x + (table.inner.width / 4),
    table.inner.y + (table.inner.height / 2),
  ]));

  balls.push(createBall(table, 'black', 8));
  balls.push(createBall(table, 'yellow', 1, -2));
  balls.push(createBall(table, 'yellow', 9, -1, 0.5, true));
  balls.push(createBall(table, 'green', 14, -1, -0.5, true));
  balls.push(createBall(table, 'blue', 2, 0, -1));
  balls.push(createBall(table, 'green', 6, 0, 1));
  balls.push(createBall(table, 'orange', 13, 1, -1.5, true));
  balls.push(createBall(table, 'darkred', 15, 1, -0.5, true));
  balls.push(createBall(table, 'darkred', 7, 1, 0.5));
  balls.push(createBall(table, 'blue', 10, 1, 1.5, true));

  balls.push(createBall(table, 'orange', 5, 2, -2));
  balls.push(createBall(table, 'purple', 12, 2, -1, true));
  balls.push(createBall(table, 'purple', 4, 2, 0));
  balls.push(createBall(table, 'red', 11, 2, 1, true));
  balls.push(createBall(table, 'red', 3, 2, 2));

  return balls;
}
