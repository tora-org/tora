import net from 'net'
import { UUID } from '../../builtin'
import { Response } from '../command/response'
import { BaseWhistle } from './base-whistle'
import { Camp } from './camp'
import { Whisper } from './whisper'

export class Whistle extends BaseWhistle {

    public readonly id = new UUID().create('short')

    protected should_buffer = false
    protected socket: net.Socket

    private ready = false
    private whisper = new Whisper()

    constructor(
        socket: net.Socket,
        camp: Camp,
    ) {
        super()

        this.socket = socket

        this.socket.on('drain', () => this.on_drain())
        this.socket.on('error', err => this.on_error(err))
        this.socket.on('data', data => this.whisper.hear(data))
        this.socket.on('close', () => camp._client.delete(this))

        this.whisper.on('request', req => {
            new Promise<object>((resolve, reject) => {
                camp.execute(req.task_name, req.data).then(resolve).catch(reject)
            }).then(async data => this.write(await new Response(data, req.id).prepare()))
        })

        this.whisper.on('parse_error', res => {
            // TODO:
        })

        // to be continue
        this.socket.on('ready', () => this.ready = true)
        this.socket.on('timeout', () => console.log('event timeout'))
        this.socket.on('end', () => console.log('event end'))
    }

    destroy() {
        this.socket.end(() => {
            this.socket.destroy()
        })
    }
}
