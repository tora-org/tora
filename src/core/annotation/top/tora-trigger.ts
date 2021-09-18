/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraTriggerOptions } from '../../../types'
import { makeProviderCollector, makeTaskCollector } from '../../collector'
import { TokenUtils } from '../../token-utils'

/**
 * 把一个类标记为 Tora.ToraTrigger，并配置元数据。
 *
 * [[include:core/tora-trigger.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraTrigger(options?: ToraTriggerOptions) {
    return function(constructor: any) {
        TokenUtils.setComponentTypeNX(constructor, 'ToraTrigger')
        TokenUtils.ToraTriggerOptions(constructor).set(options)
        TokenUtils.ToraTriggerTaskCollector(constructor).set(makeTaskCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector(constructor).set(makeProviderCollector(constructor, options))
    }
}
