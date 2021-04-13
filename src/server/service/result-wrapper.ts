/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Extend this class to implement ResultWrapper.
 *
 * @category Abstract Service
 */
export abstract class ResultWrapper {
    abstract wrap(result: any): object
}
