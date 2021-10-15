/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Channel } from 'amqplib'
import { Options } from 'amqplib/properties'
import { Deque } from '../core'

export class ChannelWrapper {

    private channel_drain?: boolean = true
    private channel_publish_queue: Deque<[exchange: string, routingKey: string, content: Buffer, options?: Options.Publish]> = new Deque()
    public channel_error?: any
    public channel: Channel | undefined

    constructor(
        channel: Channel
    ) {
        this.channel = channel
        channel.on('drain', () => {
            this.channel_drain = true
            while (this.channel && this.channel_drain && !this.channel_publish_queue.isEmpty()) {
                const args = this.channel_publish_queue.pop()!
                this.channel_drain = this.channel.publish(...args)
            }
        })
        channel.on('close', () => {
            this.channel = undefined
        })
        channel.on('error', err => {
            this.channel = undefined
            this.channel_error = err
        })
    }

    publish(exchange: string, routing_key: string, content: Buffer, options?: Options.Publish): void {
        if (this.channel_drain) {
            this.channel_drain = this.channel?.publish(exchange, routing_key, content, options)
        } else {
            this.channel_publish_queue.push([exchange, routing_key, content, options])
        }
    }
}
