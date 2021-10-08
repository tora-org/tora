import net from 'net'
import { UUID } from '../../builtin'
import { HeartBeat } from '../command/heart-beat'
import { Request } from '../command/request'
import { BaseWhistle } from './base-whistle'
import { Whisper } from './whisper'

export class Sentry extends BaseWhistle {

    public readonly id = new UUID().create('short')

    protected should_buffer = false
    protected socket: net.Socket

    private ready = false

    private pending_request: Record<string, Request> = {}
    private whisper = new Whisper()

    private interval?: NodeJS.Timeout

    constructor(
        host: string,
        port: number
    ) {
        super()

        this.socket = net.createConnection({ host, port })

        this.socket.on('drain', () => this.on_drain())
        this.socket.on('error', err => this.on_error(err))
        this.socket.on('data', data => this.whisper.hear(data))

        this.whisper.on('response', res => {
            this.pending_request[res.id].resolve(res)
            delete this.pending_request[res.id]
        })
        this.whisper.on('response_error', res => {
            this.pending_request[res.id].reject(new Error(res.reason))
            delete this.pending_request[res.id]
        })

        this.whisper.on('parse_error', res => {
            // TODO:
        })

        this.interval = setInterval(async () => {
            this.write(await new HeartBeat('PING').prepare())
        }, 500)

        // to be continue
        this.socket.on('ready', () => this.ready = true)
        this.socket.on('timeout', () => console.log('event timeout'))
        this.socket.on('close', hadError => hadError)
        this.socket.on('end', () => console.log('event end'))
    }

    destroy() {
        this.socket.end(() => {
            this.socket.destroy()
        })
    }

    async send_request(name: string, data: object) {
        const req = new Request(name, data)
        this.pending_request[req.id] = req
        const message = await req.prepare()

        return new Promise((resolve, reject) => {
            req.set_promise(resolve, reject)
            this.write(message)
        })
    }
}
