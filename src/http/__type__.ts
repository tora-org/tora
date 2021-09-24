import { ExtendableContext } from 'koa'
import { Stream } from 'stream'
import { ToraHttpHandler } from './tora-http-handler'

/**
 * Koa 支持的响应体类型。
 *
 * [[include:types/koa-response-type.md]]
 */
export type KoaResponseType = string | Buffer | Stream | Object | Array<any> | null

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type HandlerReturnType<R extends KoaResponseType> = R | Promise<R>
export type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>
export type HttpHandlerKey = `${ApiMethod}-${string}`
export interface HttpHandlerDescriptor {
    method: ApiMethod,
    path: string
    handler?: HttpHandler
}

export type ApiPath = string | string[]
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ToraServer {
    handle_by(server: ToraHttpHandler): ToraServer
    listen(port: number, cb: () => void): void
    destroy(): void
}
