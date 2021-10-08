/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs'
import path from 'path'
import { ConfigData, Timestamp, UUID } from '../builtin'
import { ClassProvider, Constructor, def2Provider, Injector, ProviderDef, ProviderTreeNode, RouterFunction, TokenUtils, ToraFunctionalComponent, TriggerFunction, ValueProvider } from '../core'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandlerDescriptor, KoaResponseType, LiteContext, ToraServer } from '../http'
import { Revolver, TaskDesc } from '../schedule'
import { Authenticator } from '../service/authenticator'
import { CacheProxy } from '../service/cache-proxy'
import { LifeCycle } from '../service/life-cycle'
import { ResultWrapper } from '../service/result-wrapper'
import { TaskLifeCycle } from '../service/task-life-cycle'
import { TaskLock } from '../service/task-lock'
import { ToraConfigSchema } from '../types'

function _try_read_json(file: string) {
    try {
        const res = JSON.parse(fs.readFileSync(path.resolve(file)).toString('utf-8'))
        if (!res) {
            console.error('Specified configuration file is empty.')
            process.exit(1)
        }
        return res
    } catch (e: any) {
        console.error(`Parse configuration file failed.`)
        console.error(`    File: ${path.resolve(file)}`)
        console.error(`    Error: ${e.message}`)
        process.exit(1)
    }
}

/**
 * @private
 *
 * 遍历依赖加载树，查找没有被使用的 Tora.ToraModule。
 *
 * @param tree_node
 * @param indent
 */
export function _find_usage(tree_node: ProviderTreeNode | undefined, indent: number = 0): boolean {
    return Boolean(tree_node?.providers?.find(p => p?.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1)))
}

/**
 * Tora 运行时。
 *
 * @category Platform
 */
export class Platform {

    /**
     * @protected
     * 根注入器，在它上面还有 NullInjector。
     */
    protected root_injector = Injector.create()
    /**
     * @protected
     * Revolver 实例，用于管理定时任务。
     */
    protected readonly revolver = new Revolver()
    /**
     * @protected
     * ToraServerKoa 实例，用于管理 HTTP 连接。
     */
    protected readonly server = new ToraServer({ cors: true, body_parser: true })
    /**
     * @private
     * 记录创建 [[Platform]] 的时间，用于计算启动时间。
     */
    private readonly started_at: number

    /**
     * @private
     * ConfigData 实例，用于管理加载的配置文件内容。
     */
    private _config_data?: ConfigData

    /**
     * 加载配置文件，读文件方式。
     * @param file_path
     */
    constructor(file_path?: string)
    /**
     * 加载配置文件，JSON 对象方式。
     * @param data
     */
    constructor(data: ToraConfigSchema)
    /**
     * 加载配置文件，函数方式。
     * @param data
     */
    constructor(data: () => ToraConfigSchema)
    constructor(data?: string | ToraConfigSchema | (() => ToraConfigSchema)) {

        if (data) {
            this._load_config(data)
        }

        this.started_at = new Date().getTime()

        // 设置默认的内置 Provider，如果没有另外设置 Provider 时，查找结果为 null，而不会查找到 NullInjector。
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        this.root_injector.set_provider(ResultWrapper, new ValueProvider('ResultWrapper', null))
        this.root_injector.set_provider(TaskLifeCycle, new ValueProvider('TaskLifeCycle', null))
        this.root_injector.set_provider(TaskLock, new ValueProvider('TaskLock', null))

        // 设置默认的内置工具。
        this.root_injector.set_provider(UUID, new ClassProvider(UUID, this.root_injector))
        this.root_injector.set_provider(Timestamp, new ClassProvider(Timestamp, this.root_injector, true))
    }

    /**
     * 直接挂载 ToraService 到 [[Platform.root_injector]] 的接口。
     * @param def
     */
    provide(def: (ProviderDef<any> | Constructor<any>)) {
        def2Provider([def], this.root_injector)
        return this
    }

    /**
     * 直接加载 ToraModule 到 [[Platform.root_injector]] 的接口。
     * @param module
     */
    import(module: Constructor<any>) {
        TokenUtils.ensure_component(module, 'ToraModuleLike', meta => meta && `You can just import a "ToraModuleLike" Component, not ${meta.type}.`)
            .do(component_meta => {
                component_meta.provider_collector?.(this.root_injector)
            })
        return this
    }

    /**
     * 直接挂载 ToraRouter 到 [[Platform.root_injector]] 的接口。
     *
     * @param router_module 需要 ToraRouter。
     */
    route(router_module: Constructor<any>) {
        this._mount_component(router_module, 'ToraRouter', this.root_injector)
        return this
    }

    /**
     * 直接添加 API 的接口。
     * 如果没有设置处理函数，默认返回空字符串。
     *
     * @param method
     * @param path
     * @param func
     */
    handle<R extends KoaResponseType>(method: ApiMethod, path: ApiPath, func?: () => HandlerReturnType<R>): Platform {
        this.server.on<any, any>(method, path, func ?? (() => ''))
        return this
    }

    /**
     * 直接加载一个包含 routers 的 ToraModule。
     *
     * @param root_module
     */
    bootstrap(root_module: Constructor<any>) {

        const root_meta = TokenUtils.ensure_component(root_module, 'ToraRoot', meta => meta && `"bootstrap" can only accept "ToraRoot", not ${meta.type}.`).value
        const sub_injector = Injector.create(this.root_injector)
        const provider_tree = root_meta.provider_collector?.(sub_injector)

        sub_injector.get(Authenticator)?.set_used()
        sub_injector.get(LifeCycle)?.set_used()
        sub_injector.get(CacheProxy)?.set_used()
        sub_injector.get(ResultWrapper)?.set_used()

        root_meta.routers?.forEach(router => this._mount_component(router, 'ToraRouter', sub_injector))
        root_meta.tasks?.forEach(trigger => this._mount_component(trigger, 'ToraTrigger', sub_injector))

        provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${root_module.name} -> ${def?.name} not used.`)
            })

        return this
    }

    /**
     * 加载配置文件，读文件方式。
     * @param file_path
     */
    load_config(file_path?: string): this
    /**
     * 加载配置文件，JSON 对象方式。
     * @param data
     */
    load_config(data: ToraConfigSchema): this
    /**
     * 加载配置文件，函数方式。
     * @param data
     */
    load_config(data: () => ToraConfigSchema): this
    load_config(data?: string | ToraConfigSchema | (() => ToraConfigSchema)) {
        return this._load_config(data)
    }

    /**
     * 自定义启动信息。
     * 设计这个接口的目的是，有时候你可能需要知道程序启动时使用了哪些配置。
     *
     * @param msg_builder
     */
    loading_message(msg_builder: (config: ConfigData) => string | string[]) {
        if (this._config_data) {
            const message = msg_builder(this._config_data as any)
            if (typeof message === 'string') {
                console.log(message)
            } else {
                message?.forEach(info => console.log(info))
            }
        }
        return this
    }

    /**
     * 列出全部 API 列表。
     *
     * @param formatter 自定义格式处理函数。
     */
    show_api_list(formatter?: (desc: Omit<HttpHandlerDescriptor, 'handler'>) => string) {
        const handler_list = this.server.get_api_list()
        console.log('\nUsable API list:')
        for (const desc of handler_list) {
            console.log(formatter?.(desc) ?? `    ${desc.method.padEnd(7)} ${desc.path}`)
        }
        return this
    }

    /**
     * 展示任务列表，按执行顺序。
     *
     * @param formatter 自定义格式处理函数。
     */
    show_task_list(formatter?: (task: TaskDesc) => string) {
        const task_list = this.revolver.get_task_list()
        console.log('\nCurrent Task list:')
        for (const task of task_list) {
            console.log(formatter?.(task) ?? `    ${task.next_exec_date_string} ${task.name.padEnd(7)} ${task.crontab}`)
        }
        return this
    }

    /**
     * 直接暴露的 Koa.use 接口。
     * 考虑到可能需要使用一些 Koa 的插件。
     *
     * @param middleware
     */
    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this.server.use(middleware)
        return this
    }

    /**
     * 开始监听请求。
     */
    start(port?: number) {

        port = port ?? this._config_data?.get('tora.port') ?? 3000

        console.log(`tora server start at ${new Date().toISOString()}`)
        console.log(`    listen at port ${port}...`)

        this.server.listen(port, () => {
            const duration = new Date().getTime() - this.started_at
            console.log(`\ntora server started successfully in ${duration / 1000}s.`)
        })
        return this
    }

    destroy() {
        this.root_injector.emit('tora-destroy')
        this.revolver.destroy()
        this.server.destroy()
        return this
    }

    private _load_config(data?: string | ToraConfigSchema | (() => ToraConfigSchema)) {
        if (!data) {
            if (!fs.existsSync(path.resolve('config/default.json'))) {
                console.error('No specified configuration file, and "config/default.json" not exist.')
                process.exit(1)
            }
            this._config_data = new ConfigData(_try_read_json('config/default.json'))
        } else if (typeof data === 'string') {
            if (!fs.existsSync(path.resolve(path.resolve(data)))) {
                console.error(`Specified configuration file "${data}" not exists.`)
                process.exit(1)
            }
            this._config_data = new ConfigData(_try_read_json(data))
        } else if (typeof data === 'function') {
            this._config_data = new ConfigData(data())
        } else {
            this._config_data = new ConfigData(data)
        }
        this.root_injector.set_provider(ConfigData, new ValueProvider('ConfigData', this._config_data))
        return this
    }

    private _mount_component(module: Constructor<any>, as: ToraFunctionalComponent['type'], injector: Injector): void {
        const component_meta = TokenUtils.ensure_component(module, as).value
        const provider_tree = component_meta.provider_collector(injector)
        const function_list = component_meta.function_collector(injector)

        if (component_meta.type === 'ToraRouter') {
            function_list.forEach(f => this.server.load(f as RouterFunction<any>, injector, component_meta))
        } else if (component_meta.type === 'ToraTrigger') {
            function_list.forEach(f => this.revolver.load(f as TriggerFunction<any>, injector, component_meta))
        }

        provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${module.name} -> ${def?.name} not used.`)
            })
    }
}
