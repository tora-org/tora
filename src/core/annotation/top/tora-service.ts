/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraServiceOptions } from '../../../types'
import { TokenUtils } from '../../token-utils'

/**
 * 把一个类标记为 Tora.ToraService。
 *
 * [[include:core/tora-service.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraService(options?: ToraServiceOptions) {
    return function(target: any) {
        TokenUtils.setComponentTypeNX(target, 'ToraService')
        TokenUtils.ToraServiceName(target).set(target.name)
    }
}
