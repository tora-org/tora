/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    ClassMeta,
    ComponentMeta,
    Constructor,
    ConsumerFunction,
    ProducerFunction,
    PropertyFunction,
    PropertyMeta,
    ReflectComponent,
    RouterFunction,
    ToraModuleMetaLike,
    TriggerFunction,
} from './annotation'
import { Deque } from './deque'
import { Meta, MetaWrapper } from './meta-tool'
import { DI_TOKEN } from './token'

function check_property(prototype: any, property?: string): [PropertyDescriptor, string] {
    if (!property) {
        throw new Error('Function Decorator can not place on class.')
    }
    const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
    if (!descriptor) {
        throw new Error(`Descriptor of specified property "${property}" is empty.`)
    }
    return [descriptor, property]
}

/**
 * @private
 *
 * @param prototype
 * @param property
 */
export function init_consumer_function<T extends (...args: any) => any>(prototype: any, property?: string): ConsumerFunction<T> {
    const [descriptor, prop] = check_property(prototype, property)
    const parameter_injection = TokenUtils.PropertyMeta(prototype, prop).value?.parameter_injection
    const consumer_function: ConsumerFunction<T> = {
        type: 'ToraConsumerFunction',
        prototype,
        descriptor: descriptor,
        property: prop,
        param_types: TokenUtils.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
        handler: descriptor.value,
    }
    TokenUtils.Touched(prototype).ensure_default().do(touched => {
        touched[prop] = consumer_function
    })
    return consumer_function
}

/**
 * @private
 *
 * @param prototype
 * @param property
 */
export function init_producer_function<T extends (...args: any) => any>(prototype: any, property?: string): ProducerFunction<T> {
    if (!property) {
        throw new Error('Function Decorator can not place on class.')
    }
    const producer_function: ProducerFunction<T> = {
        type: 'ToraProducerFunction',
        prototype,
        descriptor: {  },
        property: property,
        handler: (() => null) as any,
        produce_cache: new Deque()
    }
    TokenUtils.Touched(prototype).ensure_default().do(touched => {
        touched[property] = producer_function
    })
    return producer_function
}

/**
 * @private
 *
 * @param prototype
 * @param property
 */
export function init_router_function<T extends (...args: any) => any>(prototype: any, property?: string): RouterFunction<T> {
    const [descriptor, prop] = check_property(prototype, property)
    const parameter_injection = TokenUtils.PropertyMeta(prototype, prop).value?.parameter_injection
    const router_function: RouterFunction<T> = {
        type: 'ToraRouterFunction',
        prototype,
        path: prop,
        descriptor: descriptor,
        handler: descriptor.value,
        property: prop,
        param_types: TokenUtils.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
        auth: false,
        wrap_result: true,
    }
    TokenUtils.Touched(prototype).ensure_default().do(touched => {
        touched[prop] = router_function
    })
    return router_function
}

/**
 * @private
 *
 * @param prototype
 * @param property
 */
export function init_trigger_function<T extends (...args: any) => any>(prototype: any, property?: string): TriggerFunction<T> {
    const [descriptor, prop] = check_property(prototype, property)
    const parameter_injection = TokenUtils.PropertyMeta(prototype, prop).value?.parameter_injection
    const trigger_function: TriggerFunction<T> = {
        type: 'ToraTriggerFunction',
        prototype,
        descriptor,
        handler: descriptor.value,
        property: prop,
        param_types: TokenUtils.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
        crontab: '',
        name: 'unset'
    }
    TokenUtils.Touched(prototype).ensure_default().do(touched => {
        touched[prop] = trigger_function
    })
    return trigger_function
}

/**
 * Reflect Metadata ????????????
 *
 * @category Namespace
 */
export namespace TokenUtils {

    /**
     * Tora Component ????????????
     * @category Basic Meta
     */
    export const ComponentMeta = MetaWrapper<ComponentMeta>(DI_TOKEN.component_meta, 'prototype_only')

    /**
     * ??????????????????
     * @category Basic Meta
     */
    export const CustomData = MetaWrapper<{ [prop: string]: any }>(DI_TOKEN.custom_data, 'prototype_only', () => ({}))

    /**
     * ??????????????????
     * @category Basic Meta
     */
    export const Touched = MetaWrapper<Record<string, PropertyFunction<any>>>(DI_TOKEN.touched, 'prototype_only', () => ({}))

    /**
     * ??????????????????
     * @category Basic Meta
     */
    export const ClassMeta = MetaWrapper<ClassMeta>(DI_TOKEN.class_meta, 'prototype_only', () => ({ parameter_injection: [] }))

    /**
     * ??????????????????
     * @category Basic Meta
     */
    export const PropertyMeta = MetaWrapper<PropertyMeta>(DI_TOKEN.property_meta, 'property_only', () => ({ parameter_injection: [] }))

    /**
     * ??????????????????
     * @category Basic Meta
     */
    export const RouterFunction = MetaWrapper<RouterFunction<any>>(DI_TOKEN.property_function, 'property_only', (proto, prop) => init_router_function(proto, prop))
    export const TriggerFunction = MetaWrapper<TriggerFunction<any>>(DI_TOKEN.property_function, 'property_only', (proto, prop) => init_trigger_function(proto, prop))
    export const ConsumerFunction = MetaWrapper<ConsumerFunction<any>>(DI_TOKEN.property_function, 'property_only', (proto, prop) => init_consumer_function(proto, prop))
    export const ProducerFunction = MetaWrapper<ProducerFunction<any>>(DI_TOKEN.property_function, 'property_only', (proto, prop) => init_producer_function(proto, prop))

    /**
     * ???????????????
     * @category Basic Meta
     */
    export const Dependencies = MetaWrapper<{ [property: string]: any[] }>(DI_TOKEN.dependencies, 'both', () => ({}))

    /**
     * ???????????????
     * @category Basic Meta
     */
    export const Instance = MetaWrapper<any>(DI_TOKEN.instance, 'prototype_only')

    /**
     * ??????????????????????????????????????????
     *
     * @category Reflect Metadata
     * @param constructor
     */
    export function get_constructor_parameter_types(constructor: Constructor<any>): any[] {
        return Reflect.getMetadata('design:paramtypes', constructor)
    }

    export function get_method_parameter_types(proto: any, prop: string): any[] {
        return Reflect.getMetadata('design:paramtypes', proto, prop)
    }

    /**
     * ??????????????????????????????
     *
     * @category Reflect Metadata
     * @param proto
     * @param prop
     */
    export function get_property_type(proto: any, prop: string): any {
        return Reflect.getMetadata('design:type', proto, prop)
    }

    export function ensure_component(module: Constructor<any>, type: 'ToraComponent', msg?: (meta_value: ComponentMeta | undefined, module: Constructor<any>) => string | undefined): Meta<ComponentMeta>
    export function ensure_component(module: Constructor<any>, type: 'ToraModuleLike', msg?: (meta_value: ComponentMeta | undefined, module: Constructor<any>) => string | undefined): Meta<ToraModuleMetaLike>
    export function ensure_component<K extends ComponentMeta['type']>(module: Constructor<any>, type: K, msg?: (meta_value: ComponentMeta | undefined, module: Constructor<any>) => string | undefined): Meta<ReflectComponent<K>>
    export function ensure_component<K extends ComponentMeta['type'] | 'ToraModuleLike' | 'ToraComponent'>(module: Constructor<any>, type: K, msg?: (meta_value: ComponentMeta | undefined, module: Constructor<any>) => string | undefined): Meta<any> {
        const meta = TokenUtils.ComponentMeta(module.prototype)
        const meta_value = meta.value
        if (!meta_value) {
            throw new Error(msg?.(meta_value, module) ?? `ComponentMeta of ${module.name ?? module.prototype?.toString()} is empty.`)
        }
        if (type === 'ToraComponent') {
            if (!/^(ToraRoot|ToraModule|ToraRouter|ToraTrigger|ToraService)$/.test(meta_value.type)) {
                throw new Error(msg?.(meta_value, module) ?? `${meta_value.name} is "${meta_value.type}", not "ToraComponent".`)
            }
        } else if (type === 'ToraModuleLike') {
            if (!/^(ToraRoot|ToraModule|ToraRouter|ToraTrigger)$/.test(meta_value.type)) {
                throw new Error(msg?.(meta_value, module) ?? `${meta_value.name} is "${meta_value.type}", not "ToraModuleLike".`)
            }
        } else {
            if (meta_value.type !== type) {
                throw new Error(msg?.(meta_value, module) ?? `${meta_value.name}  is "${meta_value.type}", not a "${type}".`)
            }
        }
        return meta as Meta<any>
    }
}
