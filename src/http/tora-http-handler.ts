/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Request } from 'koa'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandler, HttpHandlerDescriptor, HttpHandlerKey, KoaResponseType, LiteContext } from './__type__'

/**
 * @private
 */
export class ToraHttpHandler {

    private handlers: { [path: HttpHandlerKey]: HttpHandler } = {}

    list(need_handler?: boolean): HttpHandlerDescriptor[] {
        return Object.keys(this.handlers).sort().map((mp) => {
            const [, method, path] = /^(GET|POST|PUT|DELETE)-(.+)$/.exec(mp) ?? []
            return {
                method: method as ApiMethod,
                path: path,
                handler: need_handler ? this.handlers[mp as HttpHandlerKey] : undefined
            }
        })
    }

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.handlers[`${method}-${p}`] = handler
            }
        } else {
            this.handlers[`${method}-${path}`] = handler
        }
    }

    async handle(context: LiteContext, next: Function) {
        const req: Request & { body?: any } = context.request
        const params = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body
        const res = await this.handlers[`${req.method as ApiMethod}-${req.path}`]?.(params, context)
        if (res !== undefined) {
            context.response.body = res
        }
        return next()
    }
}
