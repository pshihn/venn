/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Code adapted from https://github.com/benfred/venn.js

import { zeros, zerosM, norm2, scale } from '../fmin/blas1';
import { bisect } from '../fmin/bisect';
import { conjugateGradient } from '../fmin/conjugate-gradient';
import { nelderMead, NelderData } from '../fmin/nelder-mead';
import { intersectionArea, circleOverlap, circleCircleIntersection, distance } from './circle-intersection';
import { Area, Point, Circle, CircleMap, Bounds, CircleCluster, OverlapItem, LayoutParameter, GradientLoss } from '../interfaces';

/** given a list of set objects, and their corresponding overlaps.
updates the (x, y, radius) attribute on each set such that their positions
roughly correspond to the desired overlaps */

export function venn(areas: Area[], parameters?: LayoutParameter): CircleMap {
  parameters = parameters || {};
  parameters.maxIterations = parameters.maxIterations || 500;
  const initialLayout = parameters.initialLayout || bestInitialLayout;
  const loss = parameters.lossFunction || lossFunction;

  // add in missing pairwise areas as having 0 size
  areas = addMissingAreas(areas);

  // initial layout is done greedily
  const circles = initialLayout(areas, parameters);

  // transform x/y coordinates to a vector to optimize
  const initial: number[] = [];
  const setids: string[] = [];
  for (const setid in circles) {
    if (circles[setid]) {
      initial.push(circles[setid].x);
      initial.push(circles[setid].y);
      setids.push(setid);
    }
  }

  // optimize initial layout from our loss function
  const solution = nelderMead(
    (values) => {
      const current: CircleMap = {};
      for (let i = 0; i < setids.length; ++i) {
        const setid = setids[i];
        current[setid] = {
          x: values[2 * i],
          y: values[2 * i + 1],
          radius: circles[setid].radius,
          // size : circles[setid].size
        };
      }
      return loss(current, areas);
    },
    initial as NelderData,
    parameters);

  // transform solution vector back to x/y points
  const positions = solution.x;
  for (let i = 0; i < setids.length; ++i) {
    const setid = setids[i];
    circles[setid].x = positions[2 * i];
    circles[setid].y = positions[2 * i + 1];
  }

  return circles;
}

const SMALL = 1e-10;

/** Returns the distance necessary for two circles of radius r1 + r2 to
have the overlap area 'overlap' */
function distanceFromIntersectArea(r1: number, r2: number, overlap: number) {
  // handle complete overlapped circles
  if (Math.min(r1, r2) * Math.min(r1, r2) * Math.PI <= overlap + SMALL) {
    return Math.abs(r1 - r2);
  }
  return bisect((distance) => circleOverlap(r1, r2, distance) - overlap, 0, r1 + r2);
}

/** Missing pair-wise intersection area data can cause problems:
treating as an unknown means that sets will be laid out overlapping,
which isn't what people expect. To reflect that we want disjoint sets
here, set the overlap to 0 for all missing pairwise set intersections */
function addMissingAreas(areas: Area[]) {
  areas = areas.slice();

  // two circle intersections that aren't defined
  const ids: string[] = [];
  const pairs = new Map<string, boolean>();
  for (let i = 0; i < areas.length; ++i) {
    const area = areas[i];
    if (area.sets.length === 1) {
      ids.push(area.sets[0]);
    } else if (area.sets.length === 2) {
      const a = area.sets[0];
      const b = area.sets[1];
      pairs.set([a, b].join(','), true);
      pairs.set([b, a].join(','), true);
    }
  }
  ids.sort((a: string, b: string) => { return a > b ? 1 : 0; });

  for (let i = 0; i < ids.length; ++i) {
    const a = ids[i];
    for (let j = i + 1; j < ids.length; ++j) {
      const b = ids[j];
      if (!pairs.has([a, b].join(','))) {
        areas.push({
          'sets': [a, b],
          'size': 0,
        });
      }
    }
  }
  return areas;
}

/// Returns two matrices, one of the euclidean distances between the sets
/// and the other indicating if there are subset or disjoint set relationships
function getDistanceMatrices(areas: Area[], sets: Area[], setids: { [key: string]: number }) {
  // initialize an empty distance matrix between all the points
  const distances = zerosM(sets.length, sets.length);
  const constraints = zerosM(sets.length, sets.length);

  // compute required distances between all the sets such that
  // the areas match
  areas.filter(function (x) { return x.sets.length === 2; })
    .map(function (current) {
      const left = setids[current.sets[0]],
        right = setids[current.sets[1]],
        r1 = Math.sqrt(sets[left].size / Math.PI),
        r2 = Math.sqrt(sets[right].size / Math.PI),
        distance = distanceFromIntersectArea(r1, r2, current.size);

      distances[left][right] = distances[right][left] = distance;

      // also update constraints to indicate if its a subset or disjoint
      // relationship
      let c = 0;
      if (current.size + 1e-10 >= Math.min(sets[left].size,
        sets[right].size)) {
        c = 1;
      } else if (current.size <= 1e-10) {
        c = -1;
      }
      constraints[left][right] = constraints[right][left] = c;
    });

  return { distances: distances, constraints: constraints };
}

/// computes the gradient and loss simulatenously for our constrained MDS optimizer
function constrainedMDSGradient(x: number[], fxprime: number[], distances: number[][], constraints: number[][]): number {
  let loss = 0;
  for (let i = 0; i < fxprime.length; ++i) {
    fxprime[i] = 0;
  }

  for (let i = 0; i < distances.length; ++i) {
    const xi = x[2 * i];
    const yi = x[2 * i + 1];
    for (let j = i + 1; j < distances.length; ++j) {
      const xj = x[2 * j];
      const yj = x[2 * j + 1];
      const dij = distances[i][j];
      const constraint = constraints[i][j];

      const squaredDistance = (xj - xi) * (xj - xi) + (yj - yi) * (yj - yi),
        distance = Math.sqrt(squaredDistance),
        delta = squaredDistance - dij * dij;

      if (((constraint > 0) && (distance <= dij)) ||
        ((constraint < 0) && (distance >= dij))) {
        continue;
      }

      loss += 2 * delta * delta;

      fxprime[2 * i] += 4 * delta * (xi - xj);
      fxprime[2 * i + 1] += 4 * delta * (yi - yj);

      fxprime[2 * j] += 4 * delta * (xj - xi);
      fxprime[2 * j + 1] += 4 * delta * (yj - yi);
    }
  }
  return loss;
}

/// takes the best working variant of either constrained MDS or greedy
function bestInitialLayout(areas: Area[], params: LayoutParameter) {
  let initial = greedyLayout(areas, params);
  const loss = params.lossFunction || lossFunction;

  // greedylayout is sufficient for all 2/3 circle cases. try out
  // constrained MDS for higher order problems, take its output
  // if it outperforms. (greedy is aesthetically better on 2/3 circles
  // since it axis aligns)
  if (areas.length >= 8) {
    const constrained = constrainedMDSLayout(areas, params);
    const constrainedLoss = loss(constrained, areas);
    const greedyLoss = loss(initial, areas);

    if (constrainedLoss + 1e-8 < greedyLoss) {
      initial = constrained;
    }
  }
  return initial;
}

/// use the constrained MDS variant to generate an initial layout
function constrainedMDSLayout(areas: Area[], params?: LayoutParameter) {
  params = params || {};
  const restarts = params.restarts || 10;

  // bidirectionally map sets to a rowid  (so we can create a matrix)
  const sets: Area[] = [];
  const setids: { [key: string]: number } = {};
  for (let i = 0; i < areas.length; ++i) {
    const area = areas[i];
    if (area.sets.length === 1) {
      setids[area.sets[0]] = sets.length;
      sets.push(area);
    }
  }

  const matrices = getDistanceMatrices(areas, sets, setids);
  let distances = matrices.distances;
  const constraints = matrices.constraints;

  // keep distances bounded, things get messed up otherwise.
  // TODO: proper preconditioner?
  const norm = norm2(distances.map(norm2)) / (distances.length);
  distances = distances.map(function (row) {
    return row.map(function (value) { return value / norm; });
  });

  const obj = (x: number[], fxprime: number[]) => {
    return constrainedMDSGradient(x, fxprime, distances, constraints);
  };

  let best: GradientLoss | null = null;
  let current: GradientLoss | null = null;
  for (let i = 0; i < restarts; ++i) {
    const initial = zeros(distances.length * 2).map(Math.random);

    current = conjugateGradient(obj, initial, params);
    if (!best || (current.fx < best.fx)) {
      best = current;
    }
  }
  const positions = best?.x || [];

  // translate rows back to (x,y,radius) coordinates
  const circles: CircleMap = {};
  for (let i = 0; i < sets.length; ++i) {
    const set = sets[i];
    circles[set.sets[0]] = {
      x: positions[2 * i] * norm,
      y: positions[2 * i + 1] * norm,
      radius: Math.sqrt(set.size / Math.PI),
    };
  }

  if (params.history) {
    for (let i = 0; i < params.history.length; ++i) {
      scale(params.history[i].x, params.history[i].x, norm);
    }
  }
  return circles;
}

/** Lays out a Venn diagram greedily, going from most overlapped sets to
least overlapped, attempting to position each new set such that the
overlapping areas to already positioned sets are basically right */
function greedyLayout(areas: Area[], params: LayoutParameter) {
  const loss = params && params.lossFunction ? params.lossFunction : lossFunction;
  // define a circle for each set
  const circles: CircleMap = {};
  const setOverlaps: { [key: string]: OverlapItem[] } = {};
  for (let i = 0; i < areas.length; ++i) {
    const area = areas[i];
    if (area.sets.length === 1) {
      const set = area.sets[0];
      circles[set] = {
        x: 1e10, y: 1e10,
        rowid: (circles as any).length, // TODO: needed
        size: area.size,
        radius: Math.sqrt(area.size / Math.PI),
      };
      setOverlaps[set] = [];
    }
  }
  areas = areas.filter(function (a) { return a.sets.length === 2; });

  // map each set to a list of all the other sets that overlap it
  for (let i = 0; i < areas.length; ++i) {
    const current = areas[i];
    let weight = (typeof current.weight === 'number') ? current.weight : 1.0;
    const left = current.sets[0], right = current.sets[1];

    // completely overlapped circles shouldn't be positioned early here
    if (current.size + SMALL >= Math.min(circles[left].size || 0, circles[right].size || 0)) {
      weight = 0;
    }

    setOverlaps[left].push({ set: right, size: current.size, weight: weight });
    setOverlaps[right].push({ set: left, size: current.size, weight: weight });
  }

  // get list of most overlapped sets
  const mostOverlapped: OverlapItem[] = [];
  for (const set in setOverlaps) {
    if (setOverlaps[set] !== undefined) {
      let size = 0;
      for (let i = 0; i < setOverlaps[set].length; ++i) {
        size += setOverlaps[set][i].size * setOverlaps[set][i].weight!;
      }
      mostOverlapped.push({ set: set, size: size });
    }
  }

  // sort by size desc
  const sortOrder = (a: OverlapItem, b: OverlapItem) => b.size - a.size;
  mostOverlapped.sort(sortOrder);

  // keep track of what sets have been laid out
  const positioned: { [key: string]: boolean } = {};
  const isPositioned = (element: OverlapItem) => {
    return element.set in positioned;
  };

  // adds a point to the output
  const positionSet = (point: Point, index: string) => {
    circles[index].x = point.x;
    circles[index].y = point.y;
    positioned[index] = true;
  };

  // add most overlapped set at (0,0)
  positionSet({ x: 0, y: 0 }, mostOverlapped[0].set);

  // get distances between all points. TODO, necessary?
  // answer: probably not
  // var distances = venn.getDistanceMatrices(circles, areas).distances;
  for (let i = 1; i < mostOverlapped.length; ++i) {
    const setIndex = mostOverlapped[i].set,
      overlap = setOverlaps[setIndex].filter(isPositioned);
    const set = circles[setIndex];
    overlap.sort(sortOrder);

    if (overlap.length === 0) {
      // this shouldn't happen anymore with addMissingAreas
      throw new Error('ERROR: missing pairwise overlap information');
    }

    const points: Point[] = [];
    for (let j = 0; j < overlap.length; ++j) {
      // get appropriate distance from most overlapped already added set
      const p1 = circles[overlap[j].set];
      const d1 = distanceFromIntersectArea(set.radius, p1.radius, overlap[j].size);

      // sample positions at 90 degrees for maximum aesthetics
      points.push({ x: p1.x + d1, y: p1.y });
      points.push({ x: p1.x - d1, y: p1.y });
      points.push({ y: p1.y + d1, x: p1.x });
      points.push({ y: p1.y - d1, x: p1.x });

      // if we have at least 2 overlaps, then figure out where the
      // set should be positioned analytically and try those too
      for (let k = j + 1; k < overlap.length; ++k) {
        const p2 = circles[overlap[k].set];
        const d2 = distanceFromIntersectArea(set.radius, p2.radius, overlap[k].size);

        const extraPoints = circleCircleIntersection(
          { x: p1.x, y: p1.y, radius: d1 },
          { x: p2.x, y: p2.y, radius: d2 }
        );

        for (let l = 0; l < extraPoints.length; ++l) {
          points.push(extraPoints[l]);
        }
      }
    }

    // we have some candidate positions for the set, examine loss
    // at each position to figure out where to put it at
    let bestLoss = 1e50, bestPoint = points[0];
    for (let j = 0; j < points.length; ++j) {
      circles[setIndex].x = points[j].x;
      circles[setIndex].y = points[j].y;
      const localLoss = loss(circles, areas);
      if (localLoss < bestLoss) {
        bestLoss = localLoss;
        bestPoint = points[j];
      }
    }

    positionSet(bestPoint, setIndex);
  }

  return circles;
}

/** Given a bunch of sets, and the desired overlaps between these sets - computes
the distance from the actual overlaps to the desired overlaps. Note that
this method ignores overlaps of more than 2 circles */
export function lossFunction(sets: CircleMap, overlaps: Area[]): number {
  let output = 0;

  const getCircles = (indices: string[]) => {
    return indices.map((i) => { return sets[i]; });
  };

  for (let i = 0; i < overlaps.length; ++i) {
    const area = overlaps[i];
    let overlap = 0;
    if (area.sets.length === 1) {
      continue;
    } else if (area.sets.length === 2) {
      const left = sets[area.sets[0]];
      const right = sets[area.sets[1]];
      overlap = circleOverlap(left.radius, right.radius,
        distance(left, right));
    } else {
      overlap = intersectionArea(getCircles(area.sets));
    }
    const weight = (typeof area.weight === 'number') ? area.weight : 1.0;
    output += weight * (overlap - area.size) * (overlap - area.size);
  }

  return output;
}

// orientates a bunch of circles to point in orientation
function orientateCircles(circles: Circle[], orientation: number, orientationOrder?: (a: Circle, b: Circle) => number) {
  if (orientationOrder === undefined) {
    circles.sort(function (a, b) { return b.radius - a.radius; });
  } else {
    circles.sort(orientationOrder);
  }
  // shift circles so largest circle is at (0, 0)
  if (circles.length > 0) {
    const largestX = circles[0].x;
    const largestY = circles[0].y;
    for (let i = 0; i < circles.length; ++i) {
      circles[i].x -= largestX;
      circles[i].y -= largestY;
    }
  }

  if (circles.length === 2) {
    // if the second circle is a subset of the first, arrange so that
    // it is off to one side. hack for https://github.com/benfred/venn.js/issues/120
    const dist = distance(circles[0], circles[1]);
    if (dist < Math.abs(circles[1].radius - circles[0].radius)) {
      circles[1].x = circles[0].x + circles[0].radius - circles[1].radius - 1e-10;
      circles[1].y = circles[0].y;
    }
  }

  // rotate circles so that second largest is at an angle of 'orientation'
  // from largest
  if (circles.length > 1) {
    const rotation = Math.atan2(circles[1].x, circles[1].y) - orientation;
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);

    for (let i = 0; i < circles.length; ++i) {
      const x = circles[i].x;
      const y = circles[i].y;
      circles[i].x = c * x - s * y;
      circles[i].y = s * x + c * y;
    }
  }

  // mirror solution if third solution is above plane specified by
  // first two circles
  if (circles.length > 2) {
    let angle = Math.atan2(circles[2].x, circles[2].y) - orientation;
    while (angle < 0) { angle += 2 * Math.PI; }
    while (angle > 2 * Math.PI) { angle -= 2 * Math.PI; }
    if (angle > Math.PI) {
      const slope = circles[1].y / (1e-10 + circles[1].x);
      for (let i = 0; i < circles.length; ++i) {
        const d = (circles[i].x + slope * circles[i].y) / (1 + slope * slope);
        circles[i].x = 2 * d - circles[i].x;
        circles[i].y = 2 * d * slope - circles[i].y;
      }
    }
  }
}

function disjointCluster(circles: Circle[]): CircleCluster[] {
  // union-find clustering to get disjoint sets
  circles.map(function (circle) { circle.parent = circle; });

  // path compression step in union find
  const find = (circle: Circle): Circle => {
    if (circle.parent !== circle) {
      circle.parent = find(circle.parent!);
    }
    return circle.parent;
  };

  const union = (x: Circle, y: Circle) => {
    const xRoot = find(x);
    const yRoot = find(y);
    xRoot.parent = yRoot;
  };

  // get the union of all overlapping sets
  for (let i = 0; i < circles.length; ++i) {
    for (let j = i + 1; j < circles.length; ++j) {
      const maxDistance = circles[i].radius + circles[j].radius;
      if (distance(circles[i], circles[j]) + 1e-10 < maxDistance) {
        union(circles[j], circles[i]);
      }
    }
  }

  // find all the disjoint clusters and group them together
  const disjointClusters = new Map<string, Circle[]>();
  for (let i = 0; i < circles.length; ++i) {
    const setid = find(circles[i]).parent!.setid;
    if (setid) {
      if (!disjointClusters.has(setid)) {
        disjointClusters.set(setid, []);
      }
      disjointClusters.get(setid)!.push(circles[i]);
    }
  }

  // cleanup bookkeeping
  circles.map(function (circle) { delete circle.parent; });

  // return in more usable form
  const ret: Circle[][] = [];
  for (const setid of disjointClusters.keys()) {
    ret.push(disjointClusters.get(setid)!);
  }
  return ret;
}

function getBoundingBox(circles: Circle[]): Bounds {
  const minMax = function (d: string) {
    const hi = Math.max.apply(null, circles.map(
      (c) => { return (c as any)[d] + c.radius; }));
    const lo = Math.min.apply(null, circles.map(
      (c) => { return (c as any)[d] - c.radius; }));
    return { max: hi, min: lo };
  };

  return { xRange: minMax('x'), yRange: minMax('y') };
}

export function normalizeSolution(solution: CircleMap, orientation: number | null, orientationOrder?: (a: Circle, b: Circle) => number) {
  if (orientation === null) {
    orientation = Math.PI / 2;
  }

  // work with a list instead of a dictionary, and take a copy so we
  // don't mutate input
  let circles: CircleCluster = [];
  for (const setid in solution) {
    const previous = solution[setid];
    circles.push({
      x: previous.x,
      y: previous.y,
      radius: previous.radius,
      setid: setid,
    });
  }

  // get all the disjoint clusters
  const clusters = disjointCluster(circles);

  // orientate all disjoint sets, get sizes
  for (let i = 0; i < clusters.length; ++i) {
    orientateCircles(clusters[i], orientation, orientationOrder);
    const bounds = getBoundingBox(clusters[i]);
    clusters[i].size = (bounds.xRange.max - bounds.xRange.min) * (bounds.yRange.max - bounds.yRange.min);
    clusters[i].bounds = bounds;
  }
  clusters.sort(function (a, b) { return b.size! - a.size!; });

  // orientate the largest at 0,0, and get the bounds
  circles = clusters[0];
  let returnBounds = circles.bounds!;

  const spacing = (returnBounds.xRange.max - returnBounds.xRange.min) / 50;

  const addCluster = (cluster: CircleCluster | null, right: boolean, bottom: boolean) => {
    if (!cluster) return;
    if (!cluster.bounds) return;

    const bounds = cluster.bounds;
    let xOffset = 0, yOffset = 0, centreing = 0;

    if (right) {
      xOffset = returnBounds.xRange.max - bounds.xRange.min + spacing;
    } else {
      xOffset = returnBounds.xRange.max - bounds.xRange.max;
      centreing = (bounds.xRange.max - bounds.xRange.min) / 2 -
        (returnBounds.xRange.max - returnBounds.xRange.min) / 2;
      if (centreing < 0) xOffset += centreing;
    }

    if (bottom) {
      yOffset = returnBounds.yRange.max - bounds.yRange.min + spacing;
    } else {
      yOffset = returnBounds.yRange.max - bounds.yRange.max;
      centreing = (bounds.yRange.max - bounds.yRange.min) / 2 -
        (returnBounds.yRange.max - returnBounds.yRange.min) / 2;
      if (centreing < 0) yOffset += centreing;
    }

    for (let j = 0; j < cluster.length; ++j) {
      cluster[j].x += xOffset;
      cluster[j].y += yOffset;
      circles.push(cluster[j]);
    }
  };

  let index = 1;
  while (index < clusters.length) {
    addCluster(clusters[index], true, false);
    addCluster(clusters[index + 1], false, true);
    addCluster(clusters[index + 2], true, true);
    index += 3;

    // have one cluster (in top left). lay out next three relative
    // to it in a grid
    returnBounds = getBoundingBox(circles);
  }

  // convert back to solution form
  const ret: CircleMap = {};
  for (let i = 0; i < circles.length; ++i) {
    const setid = circles[i].setid;
    if (setid) {
      ret[setid] = circles[i];
    }
  }
  return ret;
}

/** Scales a solution from venn.venn or venn.greedyLayout such that it fits in
a rectangle of width/height - with padding around the borders. also
centers the diagram in the available space at the same time */
export function scaleSolution(solution: CircleMap, width: number, height: number, padding: number): CircleMap {
  const circles: Circle[] = [];
  const setids: string[] = [];
  for (const setid in solution) {
    setids.push(setid);
    circles.push(solution[setid]);
  }

  width -= 2 * padding;
  height -= 2 * padding;

  const bounds = getBoundingBox(circles),
    xRange = bounds.xRange,
    yRange = bounds.yRange;

  if ((xRange.max === xRange.min) || (yRange.max === yRange.min)) {
    return solution;
  }

  const xScaling = width / (xRange.max - xRange.min),
    yScaling = height / (yRange.max - yRange.min),
    scaling = Math.min(yScaling, xScaling),

    // while we're at it, center the diagram too
    xOffset = (width - (xRange.max - xRange.min) * scaling) / 2,
    yOffset = (height - (yRange.max - yRange.min) * scaling) / 2;

  const scaled: { [setid: string]: Circle } = {};
  for (let i = 0; i < circles.length; ++i) {
    const circle = circles[i];
    scaled[setids[i]] = {
      radius: scaling * circle.radius,
      x: padding + xOffset + (circle.x - xRange.min) * scaling,
      y: padding + yOffset + (circle.y - yRange.min) * scaling,
    };
  }

  return scaled;
}