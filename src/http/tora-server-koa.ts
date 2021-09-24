/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Server } from 'http'
import Koa from 'koa'
import { LiteContext, ToraServer } from './__type__'
import { BodyParser } from './body-parser'
import { ToraHttpHandler } from './tora-http-handler'

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
export class ToraServerKoa implements ToraServer {

    private _koa = new Koa()
    private _server?: Server
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
    }

    /**
     * Expose of Koa.use
     *
     * @param middleware
     */
    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    /**
     * Set server handlers.
     *
     * @param server
     */
    handle_by(server: ToraHttpHandler): this {
        this._koa.use(async (ctx: LiteContext, next) => server.handle(ctx, next))
        return this
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

