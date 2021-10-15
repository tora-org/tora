import { KeyOfFilterType } from '../../../types'
import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceProperty } from '../__types__'
import { ProduceOptions, Producer } from './__types__'

export function Produce<T extends object, K extends KeyOfFilterType<T, Producer<any>>>(exchange: string, routing_key: string, options?: ProduceOptions): DecoratorInstanceProperty<Producer<any>> {
    return (prototype, prop) => {
        TokenUtils.ProducerFunction(prototype, prop)
            .ensure_default()
            .do(amqp_function => {
                if (amqp_function.produce) {
                    throw new Error('Duplicated decorator "Produce".')
                } else {
                    amqp_function.produce = { exchange, routing_key, options: options ?? {} }
                    const producer: Producer<any> = (message: any, produce_options?: ProduceOptions): void => {
                        console.log('default producer')
                        amqp_function.produce_cache.push([message, produce_options])
                    }
                    Object.defineProperty(prototype, prop, {
                        writable: true,
                        enumerable: true,
                        configurable: true,
                        value: producer
                    })
                }
            })
    }
}
