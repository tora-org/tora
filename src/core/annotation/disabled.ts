/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GenericTypeOfCustomMeta } from '../meta-tool'
import { TokenUtils } from '../token-utils'

/**
 * 用于标记一个 Class 或者 Class 中的一个方法为无效的。
 *
 * 目前支持这个装饰器的位置只有 ToraRouter 中标记了 @Get，@Post 等装饰器的方法。
 * 无效化的是将该函数添加进处理函数列表的操作。
 *
 * [[include:di/disabled.md]]
 *
 * @category Common Annotation
 * @param disabled_options 目前没有可用的选项内容，后续可能会添加一些。
 */
export function Disabled(disabled_options?: GenericTypeOfCustomMeta<typeof TokenUtils.DisabledMeta>) {
    return (target: any, key?: string) => {
        disabled_options = disabled_options ?? {}
        TokenUtils.DisabledMeta.set(target, key, disabled_options)
    }
}
