/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token-utils'

/**
 * 这是一个调试用的装饰器。
 * 在一个 Tora 组件上使用 `@EchoDependencies` 会在加载组件时将入参类型打印到控制台。
 * 这里的类型是指在被 Inject 装饰器替换之前的。
 *
 * **注意**：由于在执行方法装饰器时无法拿到类名，所以使用 `EchoDependencies` 输出方法参数时，必须在 class 上同时使用。单独使用在方法上的 `EchoDependencies` 不会输出任何内容。
 *
 * [[include:di/echo-dependencies.md]]
 *
 * @category Common Annotation
 */
export function EchoDependencies() {
    return function(target: any, property_key?: string) {
        if (property_key === undefined) {
            console.log(`${target.name} dependencies`, TokenUtils.getParamTypes(target))
            const dependencies = TokenUtils.Dependencies.getset(target.prototype, {})
            Object.keys(dependencies).forEach(property_key => {
                console.log(`${target.name}.${property_key} dependencies`, dependencies[property_key])
            })
        } else {
            const dependencies = TokenUtils.Dependencies.getset(target, {})
            dependencies[property_key] = TokenUtils.getParamTypes(target, property_key)
        }
    }
}
