/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraTriggerOptions } from '../../../types'
import { TokenUtils } from '../../token-utils'
import { makeProviderCollector, makeTaskCollector } from '../../collector'

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
        TokenUtils.ToraTriggerOptions.set(constructor, options)
        TokenUtils.ToraTriggerTaskCollector.set(constructor, makeTaskCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector.set(constructor, makeProviderCollector(constructor, options))
    }
}
