export class ToBeContinue extends Error {
    constructor() {
        super()
    }
}

// export class RedisError extends Error {
//     constructor(
//         public code: string | number,
//         public message: string,
//         public origin?: Error
//     ) {
//         super()
//     }
//
//     get name() {
//         return this.constructor.name
//     }
// }
//
// export class RedisConnectionError extends RedisError {
//     constructor(code: string, message: string, origin?: Error) {
//         super(code, message, origin)
//     }
// }
//
// export class ReplyError extends RedisError {
//     constructor(message: string | Buffer) {
//         super('PARSER:REPLY_ERROR', Buffer.isBuffer(message) ? message.toString() : message)
//     }
// }
//
// export class ParserError extends RedisError {
//
//     public buffer?: string
//     public offset?: number
//
//     constructor(
//         public message: string,
//     ) {
//         super('PARSER:PARSE_ERROR', message)
//     }
//
//     static create(message: string, buffer?: string, offset?: number) {
//         const ins = new ParserError(message)
//         ins.buffer = buffer
//         ins.offset = offset
//         return ins
//     }
// }

export function throw_to_be_continue(): never {
    throw new ToBeContinue()
}
