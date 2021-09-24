/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Type } from '../types'
import { Constructor } from './annotation'
import { ImportsAndProviders, ProviderTreeNode, RouterFunction, ToraRouterOptions, ToraTriggerOptions, TriggerFunction } from './annotation/__types__'
import { Injector } from './injector'
import { ClassProvider, def2Provider, Provider, ProviderDef } from './provider'
import { TokenUtils } from './token-utils'

/**
 * @private
 *
 * 加载模块及其子模块，注册 Provider。
 *
 * @param constructor
 * @param options
 */
export function makeProviderCollector(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenUtils.ensure_component(md, 'ToraModuleLike').value
            return module_meta.provider_collector(injector)
        }) ?? []

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Type<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraRouter 中的所有请求处理函数。
 *
 * @param constructor
 * @param options
 */
export function makeRouterCollector(constructor: Constructor<any>, options?: ToraRouterOptions) {
    return (injector: Injector): RouterFunction<any>[] => {
        TokenUtils.ensure_component(constructor, 'ToraRouter')

        const instance = new ClassProvider(constructor, injector).create()
        TokenUtils.Instance(constructor).set(instance)

        return TokenUtils.Touched(constructor.prototype)
            .ensure_default()
            .do(touched => Object.values(touched).forEach(item => {
                const property_meta = TokenUtils.PropertyMeta(constructor.prototype, item.property).value
                item.disabled = property_meta?.disabled
                item.pos = `${constructor.name}.${item.property}`
                item.handler = item.handler.bind(instance)
            }))
            .convert(touched => Object.values(touched).filter(item => item.type === 'ToraRouterFunction') as RouterFunction<any>[])
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraTrigger 中的所有任务。
 *
 * @param constructor
 * @param options
 */
export function makeTaskCollector(constructor: Constructor<any>, options?: ToraTriggerOptions) {
    return (injector: Injector): TriggerFunction<any>[] => {
        TokenUtils.ensure_component(constructor, 'ToraTrigger')

        const instance = new ClassProvider(constructor, injector).create()
        TokenUtils.Instance(constructor).set(instance)

        return TokenUtils.Touched(constructor.prototype)
            .ensure_default()
            .do(touched => Object.values(touched).forEach(item => {
                const property_meta = TokenUtils.PropertyMeta(constructor.prototype, item.property).value
                item.disabled = property_meta?.disabled
                item.pos = `${constructor.name}.${item.property}`
                item.handler = item.handler.bind(instance)
            }))
            .convert(touched => Object.values(touched).filter(item => item.type === 'ToraTriggerFunction') as TriggerFunction<any>[])
    }
}
