/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { makeProviderCollector, makeTaskCollector } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ToraTriggerOptions } from '../__types__'

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
            task_collector: makeTaskCollector(constructor, options),
            provider_collector: makeProviderCollector(constructor, options),
        })
    }
}
