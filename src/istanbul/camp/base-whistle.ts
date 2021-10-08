import net from 'net'
import { Deque } from '../queue'

export abstract class BaseWhistle {

    protected abstract socket: net.Socket

    protected should_buffer = false
    protected readonly buffer = new Deque<Buffer | string>()

    protected on_drain() {
        this.should_buffer = false
        while (true) {
            const buf = this.buffer.shift()
            if (!buf) {
                return
            }
            if (this.write(buf)) {
                return
            }
        }
    }

    protected write(data: Buffer | string): boolean {
        if (this.should_buffer) {
            this.buffer.push(data)
        } else {
            this.should_buffer = !this.socket.write(data)
        }
        return this.should_buffer
    }

    protected on_error(err: any) {
        if (err.code === 'ECONNREFUSED') {

        } else if (err.code === 'ECONNRESET') {

        } else {

        }
    }
}
