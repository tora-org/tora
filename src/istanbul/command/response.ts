import { deflate } from '../utils'
import { BaseCommand } from './base-command'

export class Response extends BaseCommand {

    constructor(
        public readonly data: object,
        public readonly id: string
    ) {
        super()
    }

    async prepare() {
        const data = await deflate(Buffer.from(JSON.stringify(this.data)))
        const buf_arr = [`?${this.id.length}\r\n${this.id}\r\n${data.length}`, data, '\r\n']
            .map(d => Buffer.isBuffer(d) ? d : Buffer.from(d))
        return Buffer.concat(buf_arr)
    }
}
