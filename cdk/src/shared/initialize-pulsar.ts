import { provisionedHelloWorld } from './provisioned-helloWorld';

/**
 * Returns a guarded flag for whether helloWorld is being deployed from a branch in a PR
 * as a closure to make it clearer in the chart file what is going on. The logic of this
 * may change depending on requirements
 */
export function initializeHelloWorld(): boolean {
  return provisionedHelloWorld();
}
