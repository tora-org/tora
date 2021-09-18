/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Meta } from '../meta-tool'

interface MethodDescriptor<T> {
    configurable?: boolean
    enumerable?: boolean
    writable?: boolean
    value?: T
}

interface GetterDescriptor<T> {
    configurable?: boolean
    enumerable?: boolean
    writable?: boolean
    value?: T
    get?: () => T
}

interface SetterDescriptor<T> {
    configurable?: boolean
    enumerable?: boolean
    writable?: boolean
    value?: T
    set?: (v: T) => void
}

export type Constructor<T extends object> = new(...args: any[]) => T
export type AbstractConstructor<T extends object> = abstract new(...args: any[]) => T

export type DecoratorClass<STATIC extends object = {}> = <CLASS extends object>(constructor: Constructor<CLASS> & STATIC) => Constructor<CLASS> & STATIC | void
export type DecoratorInstanceMethod = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: MethodDescriptor<VALUE_TYPE>) => MethodDescriptor<VALUE_TYPE> | void
export type DecoratorStaticMethod = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: MethodDescriptor<VALUE_TYPE>) => MethodDescriptor<VALUE_TYPE> | void
export type DecoratorInstanceGetter = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: GetterDescriptor<VALUE_TYPE>) => GetterDescriptor<VALUE_TYPE> | void
export type DecoratorStaticGetter = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: GetterDescriptor<VALUE_TYPE>) => GetterDescriptor<VALUE_TYPE> | void
export type DecoratorInstanceSetter = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: SetterDescriptor<VALUE_TYPE>) => SetterDescriptor<VALUE_TYPE> | void
export type DecoratorStaticSetter = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: SetterDescriptor<VALUE_TYPE>) => SetterDescriptor<VALUE_TYPE> | void
export type DecoratorInstanceProperty = <CLASS extends object>(prototype: CLASS, prop: string) => void
export type DecoratorStaticProperty = <CLASS extends object>(constructor: Constructor<CLASS>, prop: string) => void
export type DecoratorParameter = <CLASS extends object>(prototype: any, prop: string, index: number) => void

export type MetaValue<T> = T extends (target: any, property_key?: string) => Meta<infer P | undefined> ? P : never
