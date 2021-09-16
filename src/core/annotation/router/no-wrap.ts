/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为结果不需要进行 wrap 操作。
 *
 * @category Router Modifier
 */
export function NoWrap() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.wrap_result = false
    }
}
