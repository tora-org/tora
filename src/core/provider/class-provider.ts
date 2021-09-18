/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Provider, Type } from '../../types'
import { Injector } from '../injector'
import { TokenUtils } from '../token-utils'

/**
 * @private
 *
 * @category Injector
 */
export class ClassProvider<M> implements Provider<M> {

    public resolved?: M
    public name: string
    public used = false

    constructor(
        private cls: Type<M>,
        public injector: Injector,
        private readonly multi?: boolean,
    ) {
        this.name = cls.name
        this.multi = this.multi ?? false
    }

    /**
     * @author plankroot
     * @function create instance of this.cls and of its dependence if needed.
     *
     * @param parents: record calling path.
     *
     * @return Provider
     */
    create(parents?: any[]): M {
        const exist = parents?.indexOf(this.cls) ?? -1
        if (exist >= 0) {
            const circle_path = parents?.slice(exist) ?? []
            circle_path.push(this.cls)
            throw new Error('circle dependency: ' + circle_path.map(cls => cls.name).join(' => '))
        }
        parents = (parents ?? []).concat(this.cls)
        this.used = true
        if (this.multi) {
            return this.get_param_instance(parents)
        }
        if (!this.resolved) {
            this.resolved = this.get_param_instance(parents)
        }
        return this.resolved
    }

    /**
     * @author plankroot
     * @function mark used of provider recursively
     * @param parents
     */
    set_used(parents?: any[]): void {
        parents = (parents ?? []).concat(this.cls)
        this.used = true
        this.set_param_instance_used(parents)
    }

    private get_param_instance(parents?: any[]) {
        const provider_list = this.extract_param_types(parents)
        const param_list = provider_list?.map((provider: any) => {
            return provider?.create(parents)
        }) ?? []
        const instance = new this.cls(...param_list)

        TokenUtils.ToraServiceProperty(this.cls.prototype).default({})
            .do(service_property => {
                if (service_property.destroy_method) {
                    const destroy_method = service_property.destroy_method.bind(instance)
                    this.injector.on('tora-destroy', () => destroy_method())
                }
            })

        return instance
    }

    private set_param_instance_used(parents?: any[]) {
        this.extract_param_types(parents)?.forEach((provider: Provider<any>) => provider?.set_used(parents))
    }

    private extract_param_types(parents?: any[]) {
        const inject_token_map = TokenUtils.ParamInjection(this.cls).value
        return TokenUtils.getParamTypes(this.cls)
            ?.map((token: any, i: number) => {
                const inject_token = inject_token_map?.[i]
                if (inject_token) {
                    token = inject_token
                }
                if (token === undefined) {
                    throw new Error(`type 'undefined' at ${this.cls?.name}.constructor[${i}], if it's not specified, there maybe a circular import.`)
                }
                const provider = this.injector.get(token, `${parents?.map(p => p.name).join(' -> ')}`)
                if (provider) {
                    return provider
                }
                throw new Error(`Can't find provider of "${token}" in [${this.cls?.name}, constructor, args[${i}]]`)
            })
    }
}
