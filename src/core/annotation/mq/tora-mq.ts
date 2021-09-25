import { IGunslinger } from '../../gunslinger'
import { TokenUtils } from '../../token-utils'
import { Constructor, DecoratorClass, ToraRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tora.ToraRouter，并配置元数据。
 *
 * [[include:core/tora-router.md]]
 *
 * @category Tora Core
 * @param channel
 * @param options
 */
export function ToraMQ(channel: string, options?: ToraRouterOptions): DecoratorClass {
    return (constructor: Constructor<any> & IGunslinger<any>) => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'ToraMQ',
            name: constructor.name,
        })
    }
}
