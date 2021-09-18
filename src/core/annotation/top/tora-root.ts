/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraRootOptions } from '../../../types'
import { TokenUtils } from '../../token-utils'
import { makeProviderCollector } from '../../collector'

/**
 * 把一个类标记为 Tora.ToraRoot，并提供配置元数据。
 *
 * [[include:core/tora-root.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraRoot(options?: ToraRootOptions) {
    return function(target: any) {
        TokenUtils.setComponentTypeNX(target, 'ToraRoot')
        TokenUtils.ToraModuleProviderCollector(target).set(makeProviderCollector(target, options))
        TokenUtils.ToraRootRouters(target).set(options?.routers)
        TokenUtils.ToraRootTasks(target).set(options?.tasks)
    }
}
