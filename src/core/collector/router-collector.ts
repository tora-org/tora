import { Constructor, RouterFunction, ToraRouterOptions } from '../annotation'
import { Injector } from '../injector'
import { ClassProvider } from '../provider'
import { TokenUtils } from '../token-utils'
import { mark_touched } from './utils'

/**
 * @private
 *
 * 收集 Tora.ToraRouter 中的所有请求处理函数。
 *
 * @param constructor
 * @param options
 */
export function make_router_collector(constructor: Constructor<any>, options?: ToraRouterOptions) {

    return (injector: Injector): RouterFunction<any>[] => {
        TokenUtils.ensure_component(constructor, 'ToraRouter')
        const instance = new ClassProvider(constructor, injector).create()
        TokenUtils.Instance(constructor).set(instance)

        return TokenUtils.Touched(constructor.prototype)
            .ensure_default()
            .do(mark_touched(constructor, instance))
            .convert(touched => Object.values(touched).filter(item => item.type === 'ToraRouterFunction') as RouterFunction<any>[])
    }
}
