import { dot, weightedSum } from './blas1';
import { GradientLoss } from '../interfaces';

/// searches along line 'pk' for a point that satifies the wolfe conditions
/// See 'Numerical Optimization' by Nocedal and Wright p59-60
/// f : objective function
/// pk : search direction
/// current: object containing current gradient/loss
/// next: output: contains next gradient/loss
/// returns a: step size taken
export function wolfeLineSearch(f: (a: number[], b: number[]) => number, pk: number[], current: GradientLoss, next: GradientLoss, ain?: number, c1in?: number, c2in?: number) {
  const phi0 = current.fx, phiPrime0 = dot(current.fxprime, pk);

  let phi = phi0, phi_old = phi0,
    phiPrime = phiPrime0,
    a0 = 0;

  let a = ain || 1;
  const c1 = c1in || 1e-6;
  const c2 = c2in || 0.1;

  const zoom = (a_lo: number, a_high: number, phi_lo: number): number => {
    for (let iteration = 0; iteration < 16; ++iteration) {
      a = (a_lo + a_high) / 2;
      weightedSum(next.x, 1.0, current.x, a, pk);
      phi = next.fx = f(next.x, next.fxprime);
      phiPrime = dot(next.fxprime, pk);

      if ((phi > (phi0 + c1 * a * phiPrime0)) ||
        (phi >= phi_lo)) {
        a_high = a;
      } else {
        if (Math.abs(phiPrime) <= -c2 * phiPrime0) {
          return a;
        }
        if (phiPrime * (a_high - a_lo) >= 0) {
          a_high = a_lo;
        }
        a_lo = a;
        phi_lo = phi;
      }
    }
    return 0;
  };

  for (let iteration = 0; iteration < 10; ++iteration) {
    weightedSum(next.x, 1.0, current.x, a, pk);
    phi = next.fx = f(next.x, next.fxprime);
    phiPrime = dot(next.fxprime, pk);
    if ((phi > (phi0 + c1 * a * phiPrime0)) ||
      (iteration && (phi >= phi_old))) {
      return zoom(a0, a, phi_old);
    }

    if (Math.abs(phiPrime) <= -c2 * phiPrime0) {
      return a;
    }

    if (phiPrime >= 0) {
      return zoom(a, a0, phi);
    }

    phi_old = phi;
    a0 = a;
    a *= 2;
  }

  return a;
}