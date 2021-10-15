import {
    ComponentMeta,
    Constructor,
    ConsumerFunction,
    ImportsAndProviders,
    PropertyFunction,
    ProviderTreeNode,
    RouterFunction,
    ToraProducerOptions, ToraRouterOptions,
    ToraTriggerOptions,
    TriggerFunction
} from './annotation'
import { ProducerFunction, ToraConsumerOptions } from './annotation/__types__'
import { Injector } from './injector'
import { ClassProvider, def2Provider, Provider, ProviderDef } from './provider'
import { TokenUtils } from './token-utils'

export function get_providers(desc: PropertyFunction<any>, injector: Injector, except_list?: any[]): Provider<any>[] {
    return desc.param_types?.map((token: any, i: number) => {
        if (token === undefined) {
            throw new Error(`type 'undefined' at ${desc.pos}[${i}], if it's not specified, there maybe a circular import.`)
        }
        if (except_list?.includes(token)) {
            return token
        }
        const provider = injector.get(token, desc.pos)
        if (provider) {
            provider.create()
            return provider
        }
        throw new Error(`Can't find provider of "${token}" in [${desc.pos}, args[${i}]]`)
    }) ?? []
}

export function mark_touched(constructor: Constructor<any>, instance: any) {
    return (touched: Record<string, PropertyFunction<any>>) => Object.values(touched).forEach(item => {
        item.meta = TokenUtils.PropertyMeta(constructor.prototype, item.property).value
        item.pos = `${constructor.name}.${item.property}`
        item.handler = item.handler.bind(instance)
    })
}

export function make_collector(type: 'ToraRouter', func_type: 'ToraRouterFunction', constructor: Constructor<any>, options?: ToraRouterOptions): (injector: Injector) => RouterFunction<any>[]
export function make_collector(type: 'ToraTrigger', func_type: 'ToraTriggerFunction', constructor: Constructor<any>, options?: ToraTriggerOptions): (injector: Injector) => TriggerFunction<any>[]
export function make_collector(type: 'ToraProducer', func_type: 'ToraProducerFunction', constructor: Constructor<any>, options?: ToraProducerOptions): (injector: Injector) => ProducerFunction<any>[]
export function make_collector(type: 'ToraConsumer', func_type: 'ToraConsumerFunction', constructor: Constructor<any>, options?: ToraConsumerOptions): (injector: Injector) => ConsumerFunction<any>[]
export function make_collector(type: ComponentMeta['type'] | 'ToraModuleLike' | 'ToraComponent', func_type: string, constructor: Constructor<any>) {
    return (injector: Injector): PropertyFunction<any>[] => {
        const meta = TokenUtils.ensure_component(constructor, type as any).value

        meta.provider = meta.provider ?? injector.get(constructor) ?? new ClassProvider(constructor, injector)
        const instance = meta.provider.create()
        TokenUtils.Instance(constructor).set(instance)

        return TokenUtils.Touched(constructor.prototype)
            .ensure_default()
            .do(mark_touched(constructor, instance))
            .convert(touched => Object.values(touched).filter((item): item is PropertyFunction<any> => item.type === func_type))
    }
}


/**
 * @private
 *
 * 加载模块及其子模块，注册 Provider。
 *
 * @param constructor
 * @param options
 */
export function make_provider_collector(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenUtils.ensure_component(md, 'ToraModuleLike').value
            return module_meta.provider_collector(injector)
        }) ?? []

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Constructor<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}
