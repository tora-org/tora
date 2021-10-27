/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect, Connection, ConsumeMessage, Options } from 'amqplib'
import EventEmitter from 'events'
import { ConsumerFunction, get_providers, Injector, ProduceOptions, ProducerFunction, ToraConsumerMeta, ToraProducerMeta } from '../core'
import { ChannelWrapper } from './channel-wrapper'
import { Ack, Dead, Requeue } from './error'
import { Letter, PURE_LETTER } from './letter'

export class MessageQueue {

    public connection?: Connection
    public readonly consumer_cache: Array<[meta: ToraConsumerMeta, injector: Injector]> = []
    public readonly producer_cache: Array<[meta: ToraProducerMeta, injector: Injector]> = []
    public readonly emitter = new EventEmitter()
    public url?: string | Options.Connect
    public socket_options?: any
    private interval_num?: NodeJS.Timeout
    private loading = false

    set_config(url: string | Options.Connect, socket_options?: any) {
        this.url = url
        this.socket_options = socket_options
    }

    destroy() {
        this.connection?.close()
    }

    load(meta: ToraProducerMeta | ToraConsumerMeta, injector: Injector) {
        if (meta.type === 'ToraConsumer') {
            this.consumer_cache.push([meta, injector])
        } else {
            this.producer_cache.push([meta, injector])
        }
    }

    start() {
        if (!this.url) {
            return
        }
        const url = this.url
        connect(url, this.socket_options).then(async conn => {
            this.connection = conn
            conn.on('error', () => {
                connect(url, this.socket_options).then(conn => {
                    this.connection = conn
                    this.emitter.emit('reconnected')
                })
            })
            if (!this.interval_num) {
                this.interval_num = setInterval(async () => {
                    if (this.loading || !this.connection) {
                        return
                    }
                    if (!this.producer_cache.length && !this.consumer_cache.length) {
                        return
                    }
                    this.loading = true
                    while (this.producer_cache.length) {
                        const [meta, injector] = this.producer_cache.pop()!
                        await this._load(conn, meta, injector)
                    }
                    while (this.consumer_cache.length) {
                        const [meta, injector] = this.consumer_cache.pop()!
                        await this._load(conn, meta, injector)
                    }
                    this.loading = false
                }, 100)
            }
        }).catch(err => {
            console.log(err)
            process.exit(255)
        })
    }

    private async _load(conn: Connection, meta: ToraProducerMeta | ToraConsumerMeta, injector: Injector) {
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
            const function_list = meta.function_collector()
                .filter((func) => func.type === 'ToraProducerFunction')
            for (const func of function_list) {
                if (!func.meta?.disabled) {
                    await this.put_producer(func)
                }
            }
        } else {
            const function_list = meta.function_collector()
                .filter((func) => func.type === 'ToraConsumerFunction')
            for (const func of function_list) {
                if (!func.meta?.disabled) {
                    await this.put_consumer(injector, func, [Letter, PURE_LETTER])
                }
            }
        }
        await channel.close()
    }

    private async put_producer(desc: ProducerFunction<any>) {
        const produce = desc.produce
        if (!produce) {
            throw new Error('produce is empty')
        }
        const channel_wrapper = new ChannelWrapper(this)
        const producer = (message: any, options?: ProduceOptions): Promise<void> => {
            const o = options ? { ...produce.options, ...options } : produce.options
            return channel_wrapper.publish(produce.exchange, produce.routing_key, Buffer.from(JSON.stringify(message)), o)
        }
        Object.defineProperty(desc.prototype, desc.property, {
            writable: true,
            enumerable: true,
            configurable: true,
            value: producer
        })
        while (desc.produce_cache.length) {
            const [msg, options, resolve, reject] = desc.produce_cache.shift()!
            const o = options ? { ...produce.options, ...options } : produce.options
            channel_wrapper.pure_publish(produce.exchange, produce.routing_key, Buffer.from(JSON.stringify(msg)), o, resolve, reject)
        }
    }

    private async put_consumer(injector: Injector, desc: ConsumerFunction<any>, except_list?: any[]): Promise<void> {

        const consume = desc.consume
        if (!consume) {
            throw new Error('consume is empty')
        }
        const channel_wrapper = new ChannelWrapper(this)
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
                channel_wrapper.channel?.ack(msg)
            } catch (reason) {
                if (reason instanceof Ack) {
                    channel_wrapper.channel?.ack(msg)
                } else if (reason instanceof Requeue) {
                    channel_wrapper.channel?.reject(msg)
                } else if (reason instanceof Dead) {
                    channel_wrapper.channel?.reject(msg, false)
                } else {
                    channel_wrapper.channel?.reject(msg)
                }
            }
        }

        channel_wrapper.consume(consume.queue, msg => on_message(msg).catch(e => console.log('catch', e)), consume.options)
    }
}
