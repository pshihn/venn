export interface GradientLoss {
  x: number[],
  fxprime: number[]
  fx: number;
  alpha?: number;
  id?: number
}

export interface Point {
  x: number;
  y: number;
  disjoint?: boolean;
}

/** Typing for Circle object. */
export interface Circle {
  x: number;
  y: number;
  radius: number;
  setid?: string;
  parent?: Circle;
  rowid?: number
  size?: number;
}

export interface Arc {
  circle: Circle;
  width: number;
  p1: Point;
  p2: Point;
}

export interface Area {
  sets: string[];
  size: number;
  weight?: number | undefined;
}

export interface VennBaseElement extends HTMLElement {
  setSvgNode(node: SVGElement): void;
}

export interface AreaDetails {
  sets: string[];
  size: number;
  fill?: string;
  opacity?: number;
  component?: VennBaseElement;
}

export interface OverlapItem {
  set: string;
  size: number;
  weight?: number;
}

export type CircleMap = {
  [setid: string]: Circle
};

export interface Range {
  min: number;
  max: number;
}

export interface Bounds {
  xRange: Range;
  yRange: Range;
}

export interface CircleCluster extends Array<Circle> {
  size?: number;
  bounds?: Bounds;
}

export interface LayoutParameter {
  lossFunction?: (sets: CircleMap, overlaps: Area[]) => number;
  restarts?: number;
  maxIterations?: number;
  tolerance?: number;
  history?: GradientLoss[];
  initialLayout?: (areas: Area[], params: LayoutParameter) => CircleMap;
}