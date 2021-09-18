/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HandlerDescriptor, ImportsAndProviders, Provider, ProviderDef, ProviderTreeNode, ToraRouterOptions, ToraTriggerOptions, Type } from '../types'
import { Injector } from './injector'
import { ClassProvider, def2Provider } from './provider'
import { TokenUtils } from './token-utils'

/**
 * @private
 *
 * 加载模块及其子模块，注册 Provider。
 *
 * @param target
 * @param options
 */
export function makeProviderCollector(target: any, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => TokenUtils.ToraModuleProviderCollector(md).value?.(injector)) ?? []

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Type<any>)[], injector) ?? []
        ]

        return { name: target.name, providers, children }
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraRouter 中的所有请求处理函数。
 *
 * @param target
 * @param options
 */
export function makeRouterCollector(target: any, options?: ToraRouterOptions): (injector: Injector) => HandlerDescriptor[] {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        TokenUtils.Instance(target).set(instance)
        return TokenUtils.ToraRouterHandlerList(target.prototype).default([])
            .do(handlers => {
                const router_path = TokenUtils.ToraRouterPath(target).value!
                handlers?.forEach(item => {
                    item.disabled = TokenUtils.DisabledMeta(target.prototype, item.property_key).value
                    item.pos = `${target.name}.${item.property_key}`
                    item.path = router_path
                    item.handler = item.handler.bind(instance)
                })
            })
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraTrigger 中的所有任务。
 *
 * @param target
 * @param options
 */
export function makeTaskCollector(target: any, options?: ToraTriggerOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider<typeof target>(target, injector).create()
        TokenUtils.Instance(target).set(instance)
        return TokenUtils.ToraTriggerTaskList(target.prototype,).default([])
            .do(tasks => {
                tasks?.forEach((t: any) => {
                    t.handler = t.handler.bind(instance)
                    t.pos = `${target.name}.${t.property_key}`
                    t.lock = TokenUtils.LockMeta(target.prototype, t.property_key).value
                    t.disabled = TokenUtils.DisabledMeta(target.prototype, t.property_key).value
                })
            })
    }
}
