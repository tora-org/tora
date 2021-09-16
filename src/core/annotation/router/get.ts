/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NoTrailingAndLeadingSlash } from '../../../types'
import { _Get } from './utils'

/**
 * 将 Tora.ToraRouter 中的一个方法标记为 GET 请求处理函数。
 *
 * @category Router Request
 */
export function Get<T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) {
    return _Get(path_tail)
}
