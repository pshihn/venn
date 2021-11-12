export interface Point {
  x: number;
  y: number;
}

/** Typing for Circle object. */
export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Arc {
  circle: Circle;
  width: number;
  p1: Point;
  p2: Point;
}

