import net from 'net'
import { Injector } from '../../core'
import { Whistle } from './whistle'

export class Camp {

    private _server: net.Server
    _client: Set<Whistle> = new Set()
    _sheet: Record<string, string> = {}
    _army: Record<string, (data: object) => object | Promise<object>> = {}

    constructor(
        injector: Injector,
        port: number,
        host?: string,
        options?: net.ServerOpts
    ) {
        this._server = net.createServer(options, socket => this._client.add(new Whistle(socket, this)))
        this._server.listen(port, host, () => {
            console.log('opened server on', this._server.address())
        })
    }

    async execute(name: string, data: any): Promise<object> {
        const soldier = this._army[name]
        if (!soldier) {
            throw new Error()
        } else {
            return soldier(data)
        }
    }

    recruit(id: string, name: string,  func: (data: object) => object | Promise<object>) {
        this._army[id] = func
        this._sheet[id] = name
    }
}
