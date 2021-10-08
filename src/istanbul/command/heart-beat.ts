import { BaseCommand } from './base-command'

export class HeartBeat extends BaseCommand {

    constructor(
        public readonly msg: string,
    ) {
        super()
    }

    async prepare() {
        const msg = Buffer.from(this.msg)
        const buf_arr = [`~${msg.length}\r\n`, msg, '\r\n'].map(d => Buffer.isBuffer(d) ? d : Buffer.from(d))
        return Buffer.concat(buf_arr)
    }
}
