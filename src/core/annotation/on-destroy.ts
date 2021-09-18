/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token-utils'

/**
 * 将 Tora.ToraService 中的一个方法标记为清理函数。
 *
 * @category Service Modifier
 */
export function OnDestroy() {
    return (target: any, key: string, desc: PropertyDescriptor) => {
        TokenUtils.ToraServiceProperty(target).default({})
            .do(service_property => {
                service_property.destroy_method = desc.value
            })
    }
}
