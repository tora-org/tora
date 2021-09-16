/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraModuleOptions } from '../../../types'
import { TokenUtils } from '../../token-utils'
import { makeProviderCollector } from '../../collector'

/**
 * 把一个类标记为 Tora.ToraModule，并提供配置元数据。
 *
 * [[include:core/tora-module.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraModule(options?: ToraModuleOptions) {
    return function(target: any) {
        TokenUtils.setComponentTypeNX(target, 'ToraModule')
        TokenUtils.ToraModuleProviderCollector.set(target, makeProviderCollector(target, options))
    }
}
