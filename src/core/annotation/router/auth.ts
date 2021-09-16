/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为需要进行授权。
 *
 * @category Router Modifier
 */
export function Auth() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.auth = true
    }
}
