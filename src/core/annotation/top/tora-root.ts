/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { makeProviderCollector } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ToraRootOptions } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraRoot，并提供配置元数据。
 *
 * [[include:core/tora-root.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraRoot(options?: ToraRootOptions): DecoratorClass {
    return constructor => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'ToraRoot',
            name: constructor.name,
            routers: options?.routers,
            tasks: options?.tasks,
            provider_collector: makeProviderCollector(constructor, options),
        })
    }
}
