/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { load_component, set_touched } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ProducerFunction, ToraProducerOptions } from '../__types__'

export function ToraProducer(options?: ToraProducerOptions): DecoratorClass {
    return constructor => {

        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'ToraProducer',
            name: constructor.name,
            producer_options: options,
            on_load: (meta, injector) => load_component(constructor, injector, meta, 'œœ-ToraProducer'),
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is ProducerFunction<any> => item.type === 'ToraProducerFunction')
            },
        })
    }
}
