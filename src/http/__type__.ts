import { ExtendableContext } from 'koa'
import { Stream } from 'stream'
import { Injector, RouterFunction, ToraRouterMeta } from '../core'

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
    handler: HttpHandler
}

export type ApiPath = string | string[]
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ToraServer {

    list(): Omit<HttpHandlerDescriptor, 'handler'>[]

    list(need_handler: true): HttpHandlerDescriptor[]

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void

    load(func: RouterFunction<any>, injector: Injector, meta: ToraRouterMeta): void

    listen(port: number, cb: () => void): void

    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void): void

    destroy(): void
}
