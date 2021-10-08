import EventEmitter from 'events'
import { throw_to_be_continue, ToBeContinue } from '../__error__'
import { Message, MessageError, MessageHeartBeat, MessageRequest, MessageResponse, ParseCache } from '../__type__'
import { inflate } from '../utils'

async function decode_response(items: Buffer[]): Promise<MessageResponse> {
    const buf = await inflate(items[1])
    return {
        type: 'response',
        id: items[0].toString('utf-8'),
        data: JSON.parse(buf.toString('utf-8')),
    }
}

async function decode_request(items: Buffer[]): Promise<MessageRequest> {
    const buf = await inflate(items[2])
    return {
        type: 'request',
        id: items[0].toString('utf-8'),
        task_name: items[1].toString('utf-8'),
        data: JSON.parse(buf.toString('utf-8')),
    }
}

export class Whisper {

    private offset = 0
    private buffer?: Buffer
    private parse_cache?: ParseCache

    private event_emitter = new EventEmitter()

    on(event: 'request', callback: (data: MessageRequest) => void): void
    on(event: 'response', callback: (data: MessageResponse) => void): void
    on(event: 'heart_beat', callback: (data: MessageHeartBeat) => void): void
    on(event: 'response_error', callback: (data: MessageError) => void): void
    on(event: 'parse_error', callback: (err: any) => void): void
    on(event: Message['type'] | 'parse_error', callback: (data: any) => void) {
        this.event_emitter.on(event, callback)
    }

    hear(buffer: Buffer) {
        try {
            if (!this.buffer) {
                this.buffer = buffer
            } else {
                this.buffer = Buffer.concat([this.buffer, buffer])
            }

            // TODO: clear Buffer if offset is too big

            if (this.parse_cache) {
                this[`parse_${this.parse_cache.type}`]()
            }
            while (this.offset < this.buffer!.length) {
                this.parse_type()
            }
            this.offset = 0
            this.buffer = undefined
        } catch (err) {
            if (err instanceof ToBeContinue) {
            } else {
                // this.execute = undefined
                return this.event_emitter.emit('parse_error', err)
            }
        }
    }

    private parse_type() {
        switch (this.buffer![this.offset]) {
            case 0x7e: // ~ heart beat
                this.offset += 1
                return this.parse_heart_beat()
            case 0x3f: // ? request
                this.offset += 1
                return this.parse_request()
            case 0x3a: // : response
                this.offset += 1
                return this.parse_response()
            case 0x2d: // - error
                this.offset += 1
                return this.parse_response_error()
            default:
                throw new Error()
        }
    }

    private slice(start: number, end: number): Buffer {
        this.offset = end + 2
        return this.buffer!.slice(start, end)
    }

    private parse_string() {
        const end = this.buffer!.indexOf(13, this.offset)
        if (end !== -1 && end + 2 <= this.buffer!.length) {
            const length = +this.buffer!.slice(this.offset, end)
            if (end + 2 + length + 2 < this.buffer!.length) {
                return this.slice(end + 2, end + 2 + length)
            }
        }
        throw_to_be_continue()
    }

    private parse_request() {
        const cache = this.get_cache('request', 3)
        this.parse(cache)
        this.event_emitter.emit(cache.type, decode_request(cache.item_parsed))
        this.parse_cache = undefined
    }

    private parse_response() {
        const cache = this.get_cache('response', 2)
        this.parse(cache)
        this.event_emitter.emit(cache.type, decode_response(cache.item_parsed))
        this.parse_cache = undefined
    }

    private parse_response_error() {
        const cache = this.get_cache('response_error', 2)
        this.parse(cache)
        this.event_emitter.emit(cache.type, {
            id: cache.item_parsed[0].toString('utf-8'),
            reason: cache.item_parsed[1].toString('utf-8'),
        })
        this.parse_cache = undefined
    }

    private parse_heart_beat() {
        const cache = this.get_cache('heart_beat', 1)
        this.parse(cache)
        this.event_emitter.emit(cache.type, {
            msg: cache.item_parsed[0].toString('utf-8'),
        })
        this.parse_cache = undefined
    }

    private parse(cache: ParseCache) {
        for (let i = cache.item_parsed.length; i < cache.item_count; i++) {
            cache.item_parsed.push(this.parse_string())
        }
    }

    private get_cache(type: ParseCache['type'], count: number) {
        if (!this.parse_cache) {
            this.parse_cache = {
                type,
                item_count: count,
                item_parsed: []
            }
        }
        return this.parse_cache
    }
}
