import { Constructor, ToraTriggerOptions, TriggerFunction } from '../annotation'
import { Injector } from '../injector'
import { ClassProvider } from '../provider'
import { TokenUtils } from '../token-utils'
import { mark_touched } from './utils'

/**
 * @private
 *
 * 收集 Tora.ToraTrigger 中的所有任务。
 *
 * @param constructor
 * @param options
 */
export function make_trigger_collector(constructor: Constructor<any>, options?: ToraTriggerOptions) {

    return (injector: Injector): TriggerFunction<any>[] => {
        TokenUtils.ensure_component(constructor, 'ToraTrigger')

        const instance = new ClassProvider(constructor, injector).create()
        TokenUtils.Instance(constructor).set(instance)

        return TokenUtils.Touched(constructor.prototype)
            .ensure_default()
            .do(mark_touched(constructor, instance))
            .convert(touched => Object.values(touched).filter(item => item.type === 'ToraTriggerFunction') as TriggerFunction<any>[])

    }
}
