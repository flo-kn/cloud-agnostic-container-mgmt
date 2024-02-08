import { isBranchBuild } from './is-branch-build';
import { prNumber } from './pr-number';

/**
 * Returns a guarded flag for whether helloWorld is being deployed from a branch in a PR
 */
export function provisionedHelloWorld(): boolean {
  return Boolean(isBranchBuild() && prNumber());
}
