/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Server } from 'http'
import Koa from 'koa'
import { ApiParams, InnerFinish, OuterFinish, PURE_PARAMS, SessionContext, ToraError } from '../builtin'
import { Injector, RouterFunction, ToraRouterMeta } from '../core'
import { get_providers } from '../core/collector'
import { Authenticator } from '../service/authenticator'
import { CacheProxy } from '../service/cache-proxy'
import { LifeCycle } from '../service/life-cycle'
import { ResultWrapper } from '../service/result-wrapper'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandlerDescriptor, KoaResponseType, LiteContext, ToraServer } from './__type__'
import { BodyParser } from './body-parser'
import { reasonable } from './error'
import { Handler } from './handler'

declare module 'koa' {
    interface Request {
        body?: any
        rawBody: string
    }
}

function finish_process(koa_context: LiteContext, response_body: KoaResponseType) {
    koa_context.response.body = response_body
}

function do_wrap(result_wrapper: ResultWrapper | undefined, data: any, context: SessionContext) {
    if (!result_wrapper) {
        return data
    }
    const res = result_wrapper?.wrap(data, context)
    return res === undefined ? data : res
}

function do_wrap_error(result_wrapper: ResultWrapper | undefined, err: ToraError<any>, context: SessionContext) {
    if (!result_wrapper) {
        return { error: err.err_data }
    }
    const res = result_wrapper?.wrap_error(err, context)
    return res === undefined ? { error: err.err_data } : res
}

async function run_handler(handler_wrapper: () => any) {
    try {
        return await handler_wrapper?.()
    } catch (reason) {
        if (reason instanceof InnerFinish) {
            return await reason.body
        } else if (reason instanceof OuterFinish) {
            return reason
        } else {
            return new ToraError(reason)
        }
    }
}

/**
 * @private
 * Koa adaptor.
 */
export class ToraServerKoa implements ToraServer {

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
        if (!router_function.meta?.disabled) {
            const router_handler = this.makeHandler(injector, router_function, [ApiParams, SessionContext, PURE_PARAMS])
            const full_path = [meta.router_path.replace(/(\/\s*$)/g, ''), router_function.path.replace(/(^\/|\/$)/g, '')].filter(p => p).join('/')

            router_function.GET && this.on('GET', full_path, router_handler)
            router_function.POST && this.on('POST', full_path, router_handler)
            router_function.PUT && this.on('PUT', full_path, router_handler)
            router_function.DELETE && this.on('DELETE', full_path, router_handler)
        }
    }

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void {
        this._http_handler.on(method, path, handler)
    }

    /**
     * Expose of Koa.use
     *
     * @param middleware
     */
    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    list(): Omit<HttpHandlerDescriptor, 'handler'>[]
    list(need_handler: true): HttpHandlerDescriptor[]
    list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return this._http_handler.list(need_handler)
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

    private makeHandler(injector: Injector, desc: RouterFunction<any>, except_list?: any[]) {

        const provider_list = get_providers(desc, injector, except_list)

        return async function(params: any, koa_context: LiteContext) {

            const cache = injector.get(CacheProxy)?.create()
            const result_wrapper = injector.get(ResultWrapper)?.create()
            const hooks = injector.get(LifeCycle)?.create()
            const authenticator = injector.get(Authenticator)?.create()

            const auth_info = await authenticator?.auth(koa_context)

            const context = new SessionContext(koa_context, auth_info, cache, desc.cache_prefix, desc.cache_expires)

            await hooks?.on_init(context)

            if (desc.auth) {
                if (!authenticator) {
                    const err = new ToraError(new Error('no provider for <Authenticator>.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? do_wrap_error(result_wrapper, err, context) : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
                if (auth_info === undefined) {
                    const err = new ToraError(reasonable(401, 'Unauthorized.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? do_wrap_error(result_wrapper, err, context) : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
            }

            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === PURE_PARAMS) {
                    return params
                } else if (provider === ApiParams) {
                    return new ApiParams(params)
                } else if (provider === SessionContext) {
                    return context
                } else {
                    return provider.create()
                }
            })

            const handler_result: any = await run_handler(() => desc.handler(...param_list))

            if (handler_result instanceof ToraError) {
                await hooks?.on_error(context, handler_result)
                const err_response = desc.wrap_result ? do_wrap_error(result_wrapper, handler_result, context) : { error: handler_result.err_data }
                finish_process(koa_context, err_response)
            } else if (handler_result instanceof OuterFinish) {
                await hooks?.on_finish(context)
                const normal_res = desc.wrap_result ? do_wrap(result_wrapper, handler_result, context) : handler_result.body
                finish_process(koa_context, normal_res)
            } else {
                await hooks?.on_finish(context)
                const normal_res = desc.wrap_result ? do_wrap(result_wrapper, handler_result, context) : handler_result
                finish_process(koa_context, normal_res)
            }
        }
    }
}

