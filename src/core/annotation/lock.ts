/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GenericTypeOfCustomMeta } from '../meta-tool'
import { TokenUtils } from '../token-utils'

/**
 * 将 Tora.ToraTrigger 中的一个任务标记为需要上锁。
 * 通过实现 TaskLock 并注入服务来实现任务的锁机制。
 *
 * [[include:core/lock.md]]
 *
 * @category Trigger Annotation
 * @param lock_options
 */
export function Lock(lock_options?: GenericTypeOfCustomMeta<typeof TokenUtils.LockMeta>) {
    return (target: any, property_key: string) => {
        const { key, expires } = lock_options ?? {}
        TokenUtils.LockMeta.set(target, property_key, { key, expires })
    }
}
