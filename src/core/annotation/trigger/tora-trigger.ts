/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { load_component, make_provider_collector, set_touched } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ToraTriggerOptions, TriggerFunction } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraTrigger，并配置元数据。
 *
 * [[include:core/tora-trigger.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraTrigger(options?: ToraTriggerOptions): DecoratorClass {
    return constructor => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'ToraTrigger',
            name: constructor.name,
            trigger_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => load_component(constructor, injector, meta, 'œœ-ToraTrigger'),
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is TriggerFunction<any> => item.type === 'ToraTriggerFunction')
            },
        })
    }
}
