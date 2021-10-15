/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect, Connection, Options } from 'amqplib'
import { ConsumeMessage } from 'amqplib/properties'

import { Injector } from '../core'
import { ConsumerFunction, ToraProducerMeta } from '../core/annotation'
import { ProducerFunction, ToraConsumerMeta } from '../core/annotation/__types__'
import { ProduceOptions } from '../core/annotation/amqp/__types__'
import { get_providers } from '../core/collector'
import { ChannelWrapper } from './channel-wrapper'
import { Ack, Dead, Requeue } from './error'
import { Letter, PURE_LETTER } from './letter'

export class MessageQueue {

    public connection?: Connection
    public readonly load_cache: Array<[meta: ToraConsumerMeta | ToraProducerMeta, injector: Injector]> = []
    public url?: string | Options.Connect
    public socket_options?: any

    set_config(url: string | Options.Connect, socket_options?: any) {
        this.url = url
        this.socket_options = socket_options
    }

    destroy() {
        this.connection?.close()
    }

    load(meta: ToraProducerMeta | ToraConsumerMeta, injector: Injector) {
        this.load_cache.push([meta, injector])
    }

    start() {
        if (!this.url) {
            return
        }
        connect(this.url, this.socket_options).then(async conn => {
            this.connection = conn
            for (const [meta, injector] of this.load_cache) {
                const channel = await conn.createChannel()
                if (meta.type === 'ToraProducer') {
                    for (const assertion of meta.producer_options?.assertions ?? []) {
                        if (assertion.type === 'exchange') {
                            await channel.assertExchange(assertion.exchange, assertion.exchange_type, assertion.options)
                        } else {
                            await channel.assertQueue(assertion.queue, assertion.options)
                        }
                    }
                    for (const binding of meta.producer_options?.bindings ?? []) {
                        if (binding.type === 'exchange_to_exchange') {
                            await channel.bindExchange(binding.destination, binding.source, binding.routing_key)
                        } else {
                            await channel.bindQueue(binding.queue, binding.exchange, binding.routing_key)
                        }
                    }
                    const function_list = meta.function_collector(injector)
                        .filter((func) => func.type === 'ToraProducerFunction')
                    for (const func of function_list) {
                        if (!func.meta?.disabled) {
                            await this.put_producer(conn, func)
                        }
                    }
                } else {
                    const function_list = meta.function_collector(injector)
                        .filter((func) => func.type === 'ToraConsumerFunction')
                    for (const func of function_list) {
                        if (!func.meta?.disabled) {
                            await this.put_consumer(conn, injector, func, [Letter, PURE_LETTER])
                        }
                    }
                }
                await channel.close()
            }
        }).catch(err => {
            console.log(err)
            process.exit(255)
        })
    }

    private async put_producer(conn: Connection, desc: ProducerFunction<any>) {
        const produce = desc.produce
        if (!produce) {
            throw new Error('produce is empty')
        }
        const channel_wrapper = new ChannelWrapper(await conn.createChannel())
        const producer = (message: any, options?: ProduceOptions): void => {
            if (!channel_wrapper?.channel) {
                throw new Error(channel_wrapper.channel_error?.message ?? 'channel closed.')
            }
            const o = options ? { ...produce.options, ...options } : produce.options
            channel_wrapper?.publish(produce.exchange, produce.routing_key, Buffer.from(JSON.stringify(message)), o)
        }
        Object.defineProperty(desc.prototype, desc.property, {
            writable: true,
            enumerable: true,
            configurable: true,
            value: producer
        })
        for (const [msg, options] of desc.produce_cache) {
            producer(msg, options)
        }
    }

    private async put_consumer(conn: Connection, injector: Injector, desc: ConsumerFunction<any>, except_list?: any[]): Promise<void> {

        const consume = desc.consume
        if (!consume) {
            throw new Error('consume is empty')
        }
        const channel_wrapper = new ChannelWrapper(await conn.createChannel())
        const provider_list = get_providers(desc, injector, except_list)

        const on_message = async function(msg: ConsumeMessage | null): Promise<void> {
            if (!msg) {
                throw new Error('Channel closed by server.')
            }
            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === Letter) {
                    const content = JSON.parse(msg.content.toString('utf-8'))
                    return new Letter(content, msg.fields, msg.properties)
                } else if (provider === PURE_LETTER) {
                    return msg
                } else {
                    return provider.create()
                }
            })

            try {
                await desc.handler(...param_list)
                channel_wrapper?.channel?.ack(msg)
            } catch (reason) {
                if (reason instanceof Ack) {
                    channel_wrapper?.channel?.ack(msg)
                } else if (reason instanceof Requeue) {
                    channel_wrapper?.channel?.reject(msg)
                } else if (reason instanceof Dead) {
                    channel_wrapper?.channel?.reject(msg, false)
                } else {
                    channel_wrapper?.channel?.reject(msg)
                }
            }
        }

        channel_wrapper?.channel?.consume(consume.queue, msg => on_message(msg).catch(e => console.log('catch', e)), consume.options)
    }
}
