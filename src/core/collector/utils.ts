import { Constructor, PropertyFunction } from '../annotation'
import { Injector } from '../injector'
import { Provider } from '../provider'
import { TokenUtils } from '../token-utils'

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
