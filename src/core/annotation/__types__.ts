/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ApiMethod } from '../../http'
import { Schedule } from '../../schedule'
import { Injector } from '../injector'
import { Meta } from '../meta-tool'
import { Provider, ProviderDef } from '../provider'
import { TokenUtils } from '../token-utils'
import ComponentMeta = TokenUtils.ComponentMeta

export type Constructor<T extends object> = new(...args: any[]) => T
export type AbstractConstructor<T extends object> = abstract new(...args: any[]) => T

export type DecoratorClass<STATIC extends object = any> = <CLASS extends object>(constructor: Constructor<CLASS> & STATIC) => Constructor<CLASS> & STATIC | void
export type DecoratorInstanceMethod = <VALUE_TYPE extends (...args: any) => any, CLASS extends object>(prototype: CLASS, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void
export type DecoratorStaticMethod = <VALUE_TYPE extends (...args: any) => any, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void
export type DecoratorInstanceAccessor = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void
export type DecoratorStaticAccessor = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void
export type DecoratorInstanceProperty = <CLASS extends object>(prototype: CLASS, prop: string) => void
export type DecoratorStaticProperty = <CLASS extends object>(constructor: Constructor<CLASS>, prop: string) => void
export type DecoratorParameter = <CLASS extends object>(target: Constructor<CLASS> | CLASS, prop: string | undefined, index: number) => void

export type MetaValue<T> = T extends (target: any, property_key?: string) => Meta<infer P | undefined> ? P : never

interface BaseToraComponentMeta {
    type: string
    name: string
}

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
}

export interface ToraModuleOptions extends ImportsAndProviders {

}

export interface ToraRootOptions extends ImportsAndProviders {
    routers?: Constructor<any>[]
    tasks?: Constructor<any>[]
}

export interface ToraRouterOptions extends ImportsAndProviders {

}

export interface ToraTriggerOptions extends ImportsAndProviders {

}

export interface ToraServiceOptions {
    echo_dependencies?: boolean
}

/**
 * @interface ProviderTreeNode
 */
export interface ProviderTreeNode {
    name: string
    providers: (Provider<any> | undefined)[]
    children: (ProviderTreeNode | undefined)[]
}

interface BaseToraModuleMeta extends BaseToraComponentMeta {
    provider_collector: (injector: Injector) => ProviderTreeNode
}

export interface ToraServiceMeta extends BaseToraComponentMeta {
    type: 'ToraService'
}

export interface ToraModuleMeta extends BaseToraModuleMeta {
    type: 'ToraModule'
}

export interface ToraRouterMeta extends BaseToraModuleMeta {
    type: 'ToraRouter'
    router_path: `/${string}`
    router_options?: ToraRouterOptions
    handler_collector: (injector: Injector) => RouterFunction<any>[]
}

export interface ToraTriggerMeta extends BaseToraModuleMeta {
    type: 'ToraTrigger'
    trigger_options?: ToraTriggerOptions
    task_collector: (injector: Injector) => TriggerFunction<any>[]
}

export interface ToraRootMeta extends BaseToraModuleMeta {
    type: 'ToraRoot'
    routers?: Constructor<any>[]
    tasks?: Constructor<any>[]
}

export type ToraModuleMetaLike =
    | ToraModuleMeta
    | ToraRouterMeta
    | ToraTriggerMeta
    | ToraRootMeta

export type ComponentMeta =
    | ToraServiceMeta
    | ToraModuleMetaLike

export type ReflectComponent<K extends ComponentMeta['type'], T extends ComponentMeta = ComponentMeta> = T extends { type: K } ? T : never

export interface ClassMeta {
    on_destroy?: TypedPropertyDescriptor<any>
    parameter_injection: any[]
    router_path_replacement: Record<string, string>
}

export interface PropertyMeta {
    disabled?: boolean
    parameter_injection: any[]
}

interface BasePropertyFunction<T extends (...args: any) => any> {
    type: string
    property: string
    descriptor: TypedPropertyDescriptor<T>
    handler: T
    param_types: Parameters<T>
    pos?: string
    disabled?: boolean
}

export interface RouterFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'ToraRouterFunction'
    path?: string
    method_and_path: { [prop: string]: [ApiMethod, string] }
    auth: boolean
    wrap_result: boolean
    cache_prefix?: string
    cache_expires?: number
}

export interface TriggerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'ToraTriggerFunction'
    schedule?: Schedule
    name?: string
    crontab: string
    lock_key?: string
    lock_expires?: number
}

export type PropertyFunction<T extends (...args: any) => any> =
    | RouterFunction<T>
    | TriggerFunction<T>
//
// export interface HandlerDescriptor {
//     path?: string
//     method_and_path?: { [prop: string]: [ApiMethod, string] }
//     handler?: any
//     param_types?: any[]
//     inject_except_list?: any[]
//     auth?: boolean
//     wrap_result?: boolean
//     cache_prefix?: string
//     cache_expires?: number
//     disabled?: {}
//     pos?: string
//     property_key?: string
// }
//
// export interface TaskDescriptor {
//     schedule?: Schedule
//     name?: string
//     crontab?: string
//     lock_key?: string
//     lock_expires?: number
//     disabled?: boolean
//     handler?: any
//     param_types?: any[]
//     property_key?: string
//     inject_except_list?: any[]
//     pos?: string
// }
