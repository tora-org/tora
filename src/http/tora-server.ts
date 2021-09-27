/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Server } from 'http'
import Koa from 'koa'
import { Injector, RouterFunction, ToraRouterMeta } from '../core'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandlerDescriptor, KoaResponseType, LiteContext } from './__type__'
import { BodyParser } from './body-parser'
import { Handler } from './handler'

declare module 'koa' {
    interface Request {
        body?: any
        rawBody: string
    }
}

/**
 * @private
 * Koa adaptor.
 */
export class ToraServer {

    private _koa = new Koa()
    private _server?: Server
    private _http_handler = new Handler()
    private _body_parser = new BodyParser()

    constructor(options: {
        cors?: boolean
        body_parser?: boolean
    }) {
        if (options.cors) {
            this._koa.use(this.cors)
        }
        if (options.body_parser) {
            this._koa.use(this.body_parser)
        }
        this._koa.use(async (ctx: LiteContext, next) => this._http_handler.handle(ctx, next))
    }

    load(router_function: RouterFunction<any>, injector: Injector, meta: ToraRouterMeta): void {
        this._http_handler.load(router_function, injector, meta)
    }

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void {
        this._http_handler.on(method, path, handler)
    }

    list(): Omit<HttpHandlerDescriptor, 'handler'>[]
    list(need_handler: true): HttpHandlerDescriptor[]
    list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return this._http_handler.list(need_handler)
    }

    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    /**
     * Koa listen
     *
     * @param port
     * @param cb
     */
    listen(port: number, cb: () => void): void {
        this._server = this._koa.on('error', (err, ctx: LiteContext) => {
            if (err.code !== 'HPE_INVALID_EOF_STATE') {
                console.log('server error', err, ctx)
                console.log(ctx.request.rawBody)
            }
        }).listen(port, cb)
    }

    destroy() {
        this._server?.close()
    }

    private body_parser: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.request.body !== undefined || ctx.disableBodyParser) {
            return await next()
        }
        try {
            const res = await this._body_parser.parseBody(ctx)
            ctx.request.body = 'parsed' in res ? res.parsed : {}
            if (ctx.request.rawBody === undefined) {
                ctx.request.rawBody = res.raw
            }
        } catch (err) {
            ctx.response.status = 400
            ctx.response.body = 'Bad Request'
            console.log('parse body error', ctx.request.path)
        }
        return await next()
    }

    private cors: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.response.res.setHeader('Access-Control-Allow-Origin', '*')
        if (ctx.method === 'OPTIONS') {
            ctx.response.res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin,origin,Content-Type,Accept,Authorization')
            ctx.response.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
            ctx.response.body = ''
        }
        return await next()
    }
}

