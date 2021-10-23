/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Channel, Connection, ConsumeMessage, Options } from 'amqplib'
import EventEmitter from 'events'
import { Deque } from '../core'

type ConsumeArguments = [queue: string, on_message: (msg: ConsumeMessage | null) => void, options?: Options.Consume]
type PublishArguments = [exchange: string, routingKey: string, content: Buffer, options?: Options.Publish]

export class ChannelWrapper {

    public channel_error?: any
    public channel: Channel | undefined
    private channel_drain?: boolean = true
    private channel_publish_queue: Deque<PublishArguments> = new Deque()
    private consumers: Map<ConsumeArguments, string | null> = new Map()

    constructor(
        private wrapper: { connection?: Connection, emitter: EventEmitter }
    ) {
        wrapper.emitter.on('reconnected', () => this.recreate_channel())
        this.recreate_channel()
    }

    recreate_channel() {
        this.consumers.forEach((_, key) => this.consumers.set(key, null))
        this.wrapper.connection?.createChannel().then(channel => {
            if (!channel) {
                return
            }
            this.channel = channel
            this.channel_drain = true
            channel.on('drain', () => {
                this.flush_publish()
            })
            channel.on('close', () => {
                this.channel = undefined
            })
            channel.on('error', err => {
                this.channel = undefined
                this.channel_error = err
                this.recreate_channel()
            })
            this.flush_publish()
            for (const args of this.consumers.keys()) {
                if (this.consumers.get(args)) {
                    continue
                }
                channel.consume(...args).then(res => {
                    this.consumers.set(args, res.consumerTag)
                })
            }
        })

    }

    publish(exchange: string, routing_key: string, content: Buffer, options?: Options.Publish): void {
        if (!this.channel || !this.channel_drain) {
            this.channel_publish_queue.push([exchange, routing_key, content, options])
        } else {
            this.channel_drain = this.channel.publish(exchange, routing_key, content, options)
        }
    }

    consume(queue: string, on_message: (msg: ConsumeMessage | null) => void, options?: Options.Consume): void {
        const args: ConsumeArguments = [queue, on_message, options]
        this.consumers.set(args, null)
        if (this.channel) {
            this.channel.consume(...args).then(res => this.consumers.set(args, res.consumerTag))
        }
    }

    private flush_publish() {
        this.channel_drain = true
        while (this.channel && this.channel_drain && !this.channel_publish_queue.isEmpty()) {
            const args = this.channel_publish_queue.shift()!
            this.channel_drain = this.channel.publish(...args)
        }
    }
}
