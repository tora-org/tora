/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraRouterOptions } from '../../../types'
import { makeProviderCollector, makeRouterCollector } from '../../collector'
import { TokenUtils } from '../../token-utils'

/**
 * 把一个类标记为 Tora.ToraRouter，并配置元数据。
 *
 * [[include:core/tora-router.md]]
 *
 * @category Tora Core
 * @param path
 * @param options
 */
export function ToraRouter(path: `/${string}`, options?: ToraRouterOptions) {
    return function(constructor: any) {

        TokenUtils.setComponentTypeNX(constructor, 'ToraRouter')
        TokenUtils.ToraRouterPath(constructor).set(path)
        TokenUtils.ToraRouterOptions(constructor).set(options)
        TokenUtils.ToraRouterHandlerCollector(constructor).set(makeRouterCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector(constructor).set(makeProviderCollector(constructor, options))

        constructor.mount = (new_path: `/${string}`) => {
            TokenUtils.ToraRouterPath(constructor).set(new_path)
            return constructor
        }

        constructor.replace = (router_method_name: string, new_path: string) => {
            TokenUtils.ToraRouterPathReplacement(constructor).default({})
                .do(replacement => {
                    replacement[router_method_name] = new_path
                })
            return constructor
        }
    }
}
