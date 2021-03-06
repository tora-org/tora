/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from '../annotation'
import { Injector } from '../injector'
import { TokenUtils } from '../token-utils'
import { ClassProviderDef, FactoryProviderDef, Provider, ProviderDef, ValueProviderDef } from './__type__'
import { ClassProvider } from './class-provider'
import { FactoryProvider } from './factory-provider'
import { ValueProvider } from './value-provider'

function isFactoryProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is FactoryProviderDef {
    return !(def as any).prototype && (def as any).useFactory
}

function isValueProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ValueProviderDef {
    return !(def as any).prototype && (def as any).useValue
}

function isClassProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ClassProviderDef<T> {
    return !(def as any).prototype && (def as any).useClass
}

/**
 * @private
 *
 * Provider 定义解析函数。
 *
 * @param defs
 * @param injector
 */
export function def2Provider(defs: (ProviderDef<any> | Constructor<any>)[], injector: Injector): (Provider<unknown> | undefined)[] | undefined {
    return defs?.map(def => {
        if (isValueProvider(def)) {
            if (injector.local_has(def.provide)) {
                return injector.get(def.provide)
            } else {
                const provider = new ValueProvider('valueProvider', def.useValue)
                injector.set_provider(def.provide, provider)
                return provider
            }

        } else if (isFactoryProvider(def)) {
            if (injector.local_has(def.provide)) {
                return injector.get(def.provide)
            } else {
                const provider = new FactoryProvider('FactoryProvider', def.useFactory as any, def.deps)
                injector.set_provider(def.provide, provider)
                return provider
            }

        } else if (isClassProvider(def)) {
            const meta = TokenUtils.ensure_component(def.useClass, 'ToraComponent').value
            if (meta.type !== 'ToraService') {
                throw new Error(`${def.useClass.name} is not ToraService.`)
            }
            if (injector.local_has(def.provide)) {
                return injector.get(def.provide)
            } else {
                const provider = new ClassProvider<any>(def.useClass, injector, def.multi)
                injector.set_provider(def.provide, provider)
                return provider
            }

        } else {
            const meta = TokenUtils.ensure_component(def, 'ToraComponent').value
            if (meta.type !== 'ToraService') {
                throw new Error(`${def.name} is not ToraService.`)
            }
            if (injector.local_has(def)) {
                return injector.get(def)
            } else {
                const provider = new ClassProvider(def, injector)
                injector.set_provider(def, provider)
                return provider
            }
        }
    })
}
