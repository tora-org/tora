import { UUID } from '../../builtin'
import { deflate } from '../utils'
import { BaseCommand } from './base-command'

export class Request extends BaseCommand {

    public readonly id: string

    constructor(
        public readonly task_name: string,
        public readonly data: object,
        id?: string
    ) {
        super()
        this.id = id ?? new UUID().create()
    }

    async prepare() {
        const name = Buffer.from(this.task_name)
        const data = await deflate(Buffer.from(JSON.stringify(this.data)))
        const buf_arr = [`?${this.id.length}\r\n${this.id}\r\n${name.length}\r\n`, name, `\r\n${data.length}`, data, '\r\n']
            .map(d => Buffer.isBuffer(d) ? d : Buffer.from(d))
        return Buffer.concat(buf_arr)
    }
}
