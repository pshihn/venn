/* eslint-disable @typescript-eslint/no-explicit-any */

import { Area, Circle, CircleMap, Point, IntersectionStats, Intersection } from '../interfaces';
import { venn, lossFunction, normalizeSolution, scaleSolution } from './layout';
import { intersectionArea, distance, getCenter } from './circle-intersection';
import { nelderMead, NelderData } from '../fmin/nelder-mead';

export interface DiagramConfig {
  width?: number;
  height?: number;
  padding?: number;
  normalize?: boolean;
  orientation?: number;
  orientationOrder?: (a: Circle, b: Circle) => number;
}

export interface ResolvedDiagramConfig extends DiagramConfig {
  width: number;
  height: number;
  padding: number;
  normalize: boolean;
  orientation: number;
}

const DFEAULT_CONFIG: ResolvedDiagramConfig = {
  width: 600,
  height: 350,
  padding: 15,
  normalize: true,
  orientation: Math.PI / 2,
};

export function diagram(areas: Area[], config?: DiagramConfig) {
  const _config = Object.assign({}, DFEAULT_CONFIG, config || {}) as ResolvedDiagramConfig;
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
  let textCenters = new Map<string, Point>();
  if (data.length) {
    let solution = venn(data, { lossFunction });
    if (_config.normalize) {
      solution = normalizeSolution(solution, _config.orientation, _config.orientationOrder);
      circles = scaleSolution(solution, _config.width, _config.height, _config.padding);
      textCenters = computeTextCenters(circles, data);
    }
  }

  return { circles, textCenters };
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

function areaKey(ids: string[]): string {
  return [...ids].sort().join(',');
}

function computeTextCenters(circles: CircleMap, areas: Area[]) {
  const ret = new Map<string, Point>();
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
    const centre = computeTextCenter(interior, exterior);
    ret.set(areaKey(area), centre);
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

function computeTextCenter(interior: Circle[], exterior: Circle[]): Point {
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
      const areaStats: IntersectionStats = { arcs: [] };
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
        ret = computeTextCenter(interior, []);

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

export function intersectionAreaPath(circles: Circle[]): Intersection | null {
  const stats: IntersectionStats = { arcs: [] };
  intersectionArea(circles, stats);
  const arcs = stats.arcs;

  if (arcs.length <= 1) {
    return null;
  } else {
    // draw path around arcs
    const pathSegments: (string | number)[] = [
      'M', arcs[0].p2.x, arcs[0].p2.y,
    ];
    for (let i = 0; i < arcs.length; ++i) {
      const arc = arcs[i], r = arc.circle.radius, wide = arc.width > r;
      pathSegments.push('A', r, r, 0, wide ? 1 : 0, 1, arc.p1.x, arc.p1.y);
    }
    return {
      path: pathSegments.join(' '),
    };
  }
}