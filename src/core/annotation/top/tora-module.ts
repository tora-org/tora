/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { make_provider_collector } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ToraModuleOptions } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraModule，并提供配置元数据。
 *
 * @category Module Annotation
 * @param options
 */
export function ToraModule(options?: ToraModuleOptions): DecoratorClass {
    return constructor => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'ToraModule',
            name: constructor.name,
            provider_collector: make_provider_collector(constructor, options)
        })
    }
}
