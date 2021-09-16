/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token-utils'

/**
 * 向 Class 标记一些自定义元信息，在自定义装饰器工具 `AnnotationTools` 中会很有用。
 *
 * 使用方式参考 [[AnnotationTools.create_decorator]]
 *
 * @category Common Annotation
 */
export function Meta<T extends object = any>(meta: T) {
    return function(target: any) {
        TokenUtils.ClassMeta.set(target, meta)
    }
}
