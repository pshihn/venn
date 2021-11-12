/* eslint-disable @typescript-eslint/no-explicit-any */

// Code adapted from https://github.com/benfred/fmin

import { weightedSum } from './blas1';

export interface NelderData extends Array<number> {
  fx: number;
  id: number
}

/** minimizes a function using the downhill simplex method */
export function nelderMead(f: (a: number[]) => number, x0: NelderData, parameters: any) {
  parameters = parameters || {};

  const maxIterations = parameters.maxIterations || x0.length * 200,
    nonZeroDelta = parameters.nonZeroDelta || 1.05,
    zeroDelta = parameters.zeroDelta || 0.001,
    minErrorDelta = parameters.minErrorDelta || 1e-6,
    minTolerance = parameters.minErrorDelta || 1e-5,
    rho = (parameters.rho !== undefined) ? parameters.rho : 1,
    chi = (parameters.chi !== undefined) ? parameters.chi : 2,
    psi = (parameters.psi !== undefined) ? parameters.psi : -0.5,
    sigma = (parameters.sigma !== undefined) ? parameters.sigma : 0.5;

  // initialize simplex.
  const N = x0.length;
  const simplex = new Array<NelderData>(N + 1);

  simplex[0] = x0;
  simplex[0].fx = f(x0);
  simplex[0].id = 0;
  for (let i = 0; i < N; ++i) {
    const point = x0.slice();
    point[i] = point[i] ? point[i] * nonZeroDelta : zeroDelta;
    simplex[i + 1] = point as NelderData;
    simplex[i + 1].fx = f(point);
    simplex[i + 1].id = i + 1;
  }

  function updateSimplex(value: NelderData) {
    for (let i = 0; i < value.length; i++) {
      simplex[N][i] = value[i];
    }
    simplex[N].fx = value.fx;
  }

  const sortOrder = function (a: NelderData, b: NelderData) { return a.fx - b.fx; };

  const centroid = x0.slice(),
    reflected = x0.slice() as NelderData,
    contracted = x0.slice() as NelderData,
    expanded = x0.slice() as NelderData;

  for (let iteration = 0; iteration < maxIterations; ++iteration) {
    simplex.sort(sortOrder);

    if (parameters.history) {
      // copy the simplex (since later iterations will mutate) and
      // sort it to have a consistent order between iterations
      const sortedSimplex = simplex.map((x) => {
        const state = x.slice() as NelderData;
        state.fx = x.fx;
        state.id = x.id;
        return state;
      });
      sortedSimplex.sort(function (a, b) { return a.id - b.id; });

      parameters.history.push({
        x: simplex[0].slice(),
        fx: simplex[0].fx,
        simplex: sortedSimplex,
      });
    }

    let maxDiff = 0;
    for (let i = 0; i < N; ++i) {
      maxDiff = Math.max(maxDiff, Math.abs(simplex[0][i] - simplex[1][i]));
    }

    if ((Math.abs(simplex[0].fx - simplex[N].fx) < minErrorDelta) &&
      (maxDiff < minTolerance)) {
      break;
    }

    // compute the centroid of all but the worst point in the simplex
    for (let i = 0; i < N; ++i) {
      centroid[i] = 0;
      for (let j = 0; j < N; ++j) {
        centroid[i] += simplex[j][i];
      }
      centroid[i] /= N;
    }

    // reflect the worst point past the centroid  and compute loss at reflected
    // point
    const worst = simplex[N];
    weightedSum(reflected, 1 + rho, centroid, -rho, worst);
    reflected.fx = f(reflected);

    // if the reflected point is the best seen, then possibly expand
    if (reflected.fx < simplex[0].fx) {
      weightedSum(expanded, 1 + chi, centroid, -chi, worst);
      expanded.fx = f(expanded);
      if (expanded.fx < reflected.fx) {
        updateSimplex(expanded);
      } else {
        updateSimplex(reflected);
      }
    }

    // if the reflected point is worse than the second worst, we need to
    // contract
    else if (reflected.fx >= simplex[N - 1].fx) {
      let shouldReduce = false;

      if (reflected.fx > worst.fx) {
        // do an inside contraction
        weightedSum(contracted, 1 + psi, centroid, -psi, worst);
        contracted.fx = f(contracted);
        if (contracted.fx < worst.fx) {
          updateSimplex(contracted);
        } else {
          shouldReduce = true;
        }
      } else {
        // do an outside contraction
        weightedSum(contracted, 1 - psi * rho, centroid, psi * rho, worst);
        contracted.fx = f(contracted);
        if (contracted.fx < reflected.fx) {
          updateSimplex(contracted);
        } else {
          shouldReduce = true;
        }
      }

      if (shouldReduce) {
        // if we don't contract here, we're done
        if (sigma >= 1) break;

        // do a reduction
        for (let i = 1; i < simplex.length; ++i) {
          weightedSum(simplex[i], 1 - sigma, simplex[0], sigma, simplex[i]);
          simplex[i].fx = f(simplex[i]);
        }
      }
    } else {
      updateSimplex(reflected);
    }
  }

  simplex.sort(sortOrder);
  return {
    fx: simplex[0].fx,
    x: simplex[0],
  };
}