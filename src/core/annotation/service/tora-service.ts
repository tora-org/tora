/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorClass, ToraServiceOptions } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraService。
 *
 * [[include:core/tora-service.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraService(options?: ToraServiceOptions): DecoratorClass {
    return constructor => {
        TokenUtils.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set({
                type: 'ToraService',
                name: constructor.name
            })
    }
}
