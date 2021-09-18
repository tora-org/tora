/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为结果不需要进行 wrap 操作。
 *
 * @category Router Modifier
 */
export function NoWrap(): DecoratorInstanceMethod {
    return (target: any, key: string) => {
        TokenUtils.ToraRouterHandler(target, key).default({}).do(handler => {
            handler.wrap_result = false
        })
    }
}
