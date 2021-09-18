/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HandlerDescriptor, ProviderTreeNode, TaskDescriptor, ToraRouterOptions, ToraTriggerOptions, Type } from '../types'
import { Injector } from './injector'
import { MetaWrapper } from './meta-tool'
import { DI_TOKEN } from './token'

/**
 * Reflect Metadata 工具集。
 *
 * @category Namespace
 */
export namespace TokenUtils {

    /**
     * ComponentType
     * @category Type
     */
    export type ComponentType = 'ToraService' | 'ToraModule' | 'ToraRoot' | 'ToraRouter' | 'ToraTrigger'

    /**
     * Tora 组件类型。
     * @category Basic Meta
     */
    export const ComponentType = MetaWrapper<ComponentType>(DI_TOKEN.class_type)

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const CustomData = MetaWrapper<{ [prop: string]: any }>(DI_TOKEN.custom_data)

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const ClassMeta = MetaWrapper<{ [prop: string]: any }>(DI_TOKEN.class_meta)

    /**
     * 参数类型。
     * @category Basic Meta
     */
    export const Dependencies = MetaWrapper<{ [property: string]: Type<any>[] }>(DI_TOKEN.dependencies)

    /**
     * 禁用相关信息。
     * @category Basic Meta
     */
    export const DisabledMeta = MetaWrapper<{}>(DI_TOKEN.disabled_meta)

    /**
     * 锁相关信息。
     * @category Basic Meta
     */
    export const LockMeta = MetaWrapper<{ key?: string, expires?: number }>(DI_TOKEN.lock_meta)

    /**
     * 存储实例。
     * @category Basic Meta
     */
    export const Instance = MetaWrapper<any>(DI_TOKEN.instance)

    /**
     * 特殊注入 token 列表。
     * @category Basic Meta
     */
    export const ParamInjection = MetaWrapper<any[]>(DI_TOKEN.param_injection)

    /**
     * ToraService 名称。
     * @category Tora Service Meta
     */
    export const ToraServiceName = MetaWrapper<string>(DI_TOKEN.tora_service_name)

    /**
     * ToraService 属性。
     * @category Tora Service Property
     */
    export const ToraServiceProperty = MetaWrapper<{ destroy_method?: Function }>(DI_TOKEN.tora_service_property)

    // ToraModule

    /**
     * ToraModule 收集函数。
     * @category Tora Module Meta
     */
    export const ToraModuleProviderCollector = MetaWrapper<(injector: Injector) => ProviderTreeNode>(DI_TOKEN.tora_module_provider_collector)

    /**
     * ToraModule 的 routers，对应 ToraModuleOptions 中的 routers。
     * @category Tora Module Meta
     */
    export const ToraRootRouters = MetaWrapper<Type<any>[] | undefined>(DI_TOKEN.tora_module_routers)

    /**
     * ToraModule 的 tasks，对应 ToraModuleOptions 中的 tasks。
     * @category Tora Module Meta
     */
    export const ToraRootTasks = MetaWrapper<Type<any>[] | undefined>(DI_TOKEN.tora_module_tasks)

    // ToraRouter

    /**
     * ToraRouter 的处理函数。
     * @category Tora Router Meta
     */
    export const ToraRouterHandler = MetaWrapper<HandlerDescriptor>(DI_TOKEN.tora_router_handler)

    /**
     * ToraRouter Handler 收集函数。
     * @category Tora Router Meta
     */
    export const ToraRouterHandlerCollector = MetaWrapper<(injector: Injector) => HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_collector)

    /**
     * 一个 ToraRouter 上全部 Handler 的列表。
     * @category Tora Router Meta
     */
    export const ToraRouterHandlerList = MetaWrapper<HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_list)

    /**
     * ToraRouterOptions。
     * @category Tora Router Meta
     */
    export const ToraRouterOptions = MetaWrapper<ToraRouterOptions | undefined>(DI_TOKEN.tora_router_options)

    /**
     * ToraRouter 挂载的绝对路径。
     * @category Tora Router Meta
     */
    export const ToraRouterPath = MetaWrapper<string>(DI_TOKEN.tora_router_absolute_path)

    /**
     * ToraRouter 路径替换列表。
     * @category Tora Router Meta
     */
    export const ToraRouterPathReplacement = MetaWrapper<{ [router_method_key: string]: string }>(DI_TOKEN.tora_router_path_replacement)

    // ToraTrigger

    /**
     * ToraTriggerOptions。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerOptions = MetaWrapper<ToraTriggerOptions | undefined>(DI_TOKEN.tora_trigger_options)

    /**
     * ToraTrigger 的任务函数。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTask = MetaWrapper<TaskDescriptor>(DI_TOKEN.tora_trigger_task)

    /**
     * ToraTrigger 的任务收集函数。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTaskCollector = MetaWrapper<(injector: Injector) => TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_collector)

    /**
     * 一个 ToraTrigger 上全部的任务列表。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTaskList = MetaWrapper<TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_list)

    /**
     * 获取指定类或函数的参数列表。
     *
     * @category Reflect Metadata
     * @param target
     * @param property_key
     */
    export function getParamTypes(target: any, property_key?: string): any[] {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:paramtypes', target)
        } else {
            return Reflect.getMetadata('design:paramtypes', target, property_key)
        }
    }

    /**
     * 获取指定目标的类型。
     *
     * @category Reflect Metadata
     * @param target
     * @param property_key
     */
    export function getType(target: any, property_key?: string): any {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:type', target)
        } else {
            return Reflect.getMetadata('design:type', target, property_key)
        }
    }

    /**
     * 当 Tora 组件类型不存在时，添加组件类型，否则抛出异常。
     *
     * @category Basic Meta
     * @param target
     * @param type
     */
    export function setComponentTypeNX(target: any, type: ComponentType) {

        const meta = TokenUtils.ComponentType(target)

        if (meta.value === type) {
            throw new Error(`Decorator duplicated on class ${target.name}, @${type} can only be used once.`)
        }

        if (meta.exist()) {
            throw new Error(`Decorator conflicts on class ${target.name}, only one of @ToraService, @ToraModule, @ToraRouter, @ToraTrigger can be used on same class.`)
        }

        meta.set(type)
    }
}
