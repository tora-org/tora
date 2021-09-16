/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为结果需要进行缓存。
 *
 * @category Router Modifier
 */
export function CacheWith(prefix?: string, expires?: number) {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.cache_prefix = prefix
        handler.cache_expires = expires
    }
}
