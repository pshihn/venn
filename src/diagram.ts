/* eslint-disable @typescript-eslint/no-explicit-any */

import { Area, Circle, CircleMap, Point } from './interfaces';
import { venn, lossFunction, normalizeSolution, scaleSolution } from './layout';
import { intersectionArea, distance, getCenter } from './circle-intersection';
import { nelderMead, NelderData } from './fmin/nelder-mead';

export interface VennDiagramConfig {
  width?: number;
  height?: number;
  padding?: number;
  normalize?: boolean;
  orientation?: number;
  orientationOrder?: (a: Circle, b: Circle) => number;
}

export interface ResolvedVennDiagramConfig extends VennDiagramConfig {
  width: number;
  height: number;
  padding: number;
  normalize: boolean;
  orientation: number;
}

const DFEAULT_CONFIG: ResolvedVennDiagramConfig = {
  width: 600,
  height: 350,
  padding: 15,
  normalize: true,
  orientation: Math.PI / 2,
};

export class VennDiagram {
  private _config: ResolvedVennDiagramConfig;

  constructor(config?: VennDiagramConfig) {
    this._config = Object.assign({}, DFEAULT_CONFIG, config || {}) as ResolvedVennDiagramConfig;
  }


  render(areas: Area[]) {
    let data = areas;
    // handle 0-sized sets by removing from input
    const toRemove = new Set<string>();
    data.forEach(function (datum) {
      if ((datum.size === 0) && datum.sets.length === 1) {
        toRemove.add(datum.sets[0]);
      }
    });
    data = data.filter(function (datum) {
      return !datum.sets.some((set) => toRemove.has(set));
    });

    let circles: CircleMap = {};
    let textCentres = new Map<string[], Point>();
    if (data.length) {
      let solution = venn(data, { lossFunction });
      if (this._config.normalize) {
        solution = normalizeSolution(solution, this._config.orientation, this._config.orientationOrder);
        circles = scaleSolution(solution, this._config.width, this._config.height, this._config.padding);
        textCentres = computeTextCentres(circles, data);
      }
    }

    return { circles, textCentres };
  }
}

function getOverlappingCircles(circles: CircleMap) {
  const ret = new Map<string, string[]>();
  const circleids: string[] = [];
  for (const circleid in circles) {
    circleids.push(circleid);
    ret.set(circleid, []);
  }
  for (let i = 0; i < circleids.length; i++) {
    const a = circles[circleids[i]];
    for (let j = i + 1; j < circleids.length; ++j) {
      const b = circles[circleids[j]];
      const d = distance(a, b);

      if (d + b.radius <= a.radius + 1e-10) {
        ret.get(circleids[j])?.push(circleids[i]);
      } else if (d + a.radius <= b.radius + 1e-10) {
        ret.get(circleids[i])?.push(circleids[j]);
      }
    }
  }
  return ret;
}

function computeTextCentres(circles: CircleMap, areas: Area[]) {
  const ret = new Map<string[], Point>();
  const overlapped = getOverlappingCircles(circles);
  for (let i = 0; i < areas.length; ++i) {
    const area = areas[i].sets;
    const areaids = new Set<string>();
    const exclude = new Set<string>();
    for (let j = 0; j < area.length; ++j) {
      areaids.add(area[j]);
      const overlaps = overlapped.get(area[j]) || [];
      // keep track of any circles that overlap this area,
      // and don't consider for purposes of computing the text
      // centre
      for (let k = 0; k < overlaps.length; ++k) {
        exclude.add(overlaps[k]);
      }
    }

    const interior: Circle[] = [];
    const exterior: Circle[] = [];
    for (const setid in circles) {
      if (areaids.has(setid)) {
        interior.push(circles[setid]);
      } else if (!(exclude.has(setid))) {
        exterior.push(circles[setid]);
      }
    }
    const centre = computeTextCentre(interior, exterior);
    ret.set(area, centre);
    if (centre.disjoint && (areas[i].size > 0)) {
      // TODO:
      // console.log("WARNING: area " + area + " not represented on screen");
    }
  }
  return ret;
}

function circleMargin(current: Point, interior: Circle[], exterior: Circle[]): number {
  let margin = interior[0].radius - distance(interior[0], current);
  for (let i = 1; i < interior.length; ++i) {
    const m = interior[i].radius - distance(interior[i], current);
    if (m <= margin) {
      margin = m;
    }
  }

  for (let i = 0; i < exterior.length; ++i) {
    const m = distance(exterior[i], current) - exterior[i].radius;
    if (m <= margin) {
      margin = m;
    }
  }
  return margin;
}

function computeTextCentre(interior: Circle[], exterior: Circle[]): Point {
  // get an initial estimate by sampling around the interior circles
  // and taking the point with the biggest margin
  const points: Point[] = [];
  for (let i = 0; i < interior.length; ++i) {
    const c = interior[i];
    points.push({ x: c.x, y: c.y });
    points.push({ x: c.x + c.radius / 2, y: c.y });
    points.push({ x: c.x - c.radius / 2, y: c.y });
    points.push({ x: c.x, y: c.y + c.radius / 2 });
    points.push({ x: c.x, y: c.y - c.radius / 2 });
  }
  let initial = points[0];
  let margin = circleMargin(points[0], interior, exterior);
  for (let i = 1; i < points.length; ++i) {
    const m = circleMargin(points[i], interior, exterior);
    if (m >= margin) {
      initial = points[i];
      margin = m;
    }
  }

  // maximize the margin numerically
  const solution = nelderMead(
    (p) => { return -1 * circleMargin({ x: p[0], y: p[1] }, interior, exterior); },
    [initial.x, initial.y] as NelderData,
    { maxIterations: 500, minErrorDelta: 1e-10 }
  ).x;

  let ret: Point = { x: solution[0], y: solution[1] };

  // check solution, fallback as needed (happens if fully overlapped
  // etc)
  let valid = true;
  for (let i = 0; i < interior.length; ++i) {
    if (distance(ret, interior[i]) > interior[i].radius) {
      valid = false;
      break;
    }
  }

  for (let i = 0; i < exterior.length; ++i) {
    if (distance(ret, exterior[i]) < exterior[i].radius) {
      valid = false;
      break;
    }
  }

  if (!valid) {
    if (interior.length === 1) {
      ret = { x: interior[0].x, y: interior[0].y };
    } else {
      const areaStats: any = {};
      intersectionArea(interior, areaStats);

      if (areaStats.arcs.length === 0) {
        ret = { 'x': 0, 'y': -1000, disjoint: true };

      } else if (areaStats.arcs.length === 1) {
        ret = {
          'x': areaStats.arcs[0].circle.x,
          'y': areaStats.arcs[0].circle.y,
        };

      } else if (exterior.length) {
        // try again without other circles
        ret = computeTextCentre(interior, []);

      } else {
        // take average of all the points in the intersection
        // polygon. this should basically never happen
        // and has some issues:
        // https://github.com/benfred/venn.js/issues/48#issuecomment-146069777
        ret = getCenter(areaStats.arcs.map(function (a: any) { return a.p1; }));
      }
    }
  }

  return ret;
}