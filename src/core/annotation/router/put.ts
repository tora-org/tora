/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import { createRequestDecorator } from '../__lib__/create-request-decorator'

/**
 * 将 Tora.ToraRouter 中的一个方法标记为 PUT 请求处理函数。
 *
 * @category Router Request
 */
export const Put = createRequestDecorator('GET')
