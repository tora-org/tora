/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClassProviderDef, FactoryProviderDef, Provider, ProviderDef, Type, ValueProviderDef } from '../../types'
import { Injector } from '../injector'
import { TokenUtils } from '../token-utils'
import { ClassProvider } from './class-provider'
import { FactoryProvider } from './factory-provider'
import { ValueProvider } from './value-provider'

/**
 * @private
 *
 * Provider 定义解析函数。
 *
 * @param defs
 * @param injector
 */
export function def2Provider(defs: (ProviderDef<any> | Type<any>)[], injector: Injector): (Provider<unknown> | undefined)[] | undefined {
    return defs?.map(def => {
        if ((def as any).useValue) {

            const d = def as ValueProviderDef
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new ValueProvider('valueProvider', d.useValue)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else if ((def as any).useFactory) {

            const d = def as FactoryProviderDef
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new FactoryProvider('FactoryProvider', d.useFactory as any, d.deps)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else if ((def as any).useClass) {

            const d = def as ClassProviderDef<any>
            const service_name = TokenUtils.ToraServiceName(d.useClass).value
            if (!service_name) {
                throw new Error(`${d.useClass.name} is not ToraService.`)
            }
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new ClassProvider<any>(d.useClass, injector, d.multi)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else {

            const service_name = TokenUtils.ToraServiceName(def).value
            if (!service_name) {
                throw new Error(`${(def as any).name} is not ToraService.`)
            }
            if (injector.local_has(def)) {
                return injector.get(def as any)
            } else {
                const provider = new ClassProvider<any>(def as any, injector)
                injector.set_provider(def, provider)
                return provider
            }
        }
    })
}
