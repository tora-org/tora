/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { makeProviderCollector, makeRouterCollector } from '../../collector'
import { IGunslinger } from '../../gunslinger'
import { TokenUtils } from '../../token-utils'
import { Constructor, DecoratorClass, ToraRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraRouter，并配置元数据。
 *
 * [[include:core/tora-router.md]]
 *
 * @category Tora Core
 * @param path
 * @param options
 */
export function ToraRouter(path: `/${string}`, options?: ToraRouterOptions): DecoratorClass {
    return (constructor: Constructor<any> & IGunslinger<any>) => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'ToraRouter',
            name: constructor.name,
            router_path: path,
            router_options: options,
            handler_collector: makeRouterCollector(constructor, options),
            provider_collector: makeProviderCollector(constructor, options),
        })

        constructor.mount = (new_path: `/${string}`) => {
            TokenUtils.ensure_component(constructor, 'ToraRouter').do(meta => {
                meta.router_path = new_path
            })
            return constructor
        }

        constructor.replace = (property_key: string, new_path: string) => {
            TokenUtils.ClassMeta(constructor).ensure_default().do(meta => {
                meta.router_path_replacement[property_key] = new_path
            })
            return constructor
        }
    }
}