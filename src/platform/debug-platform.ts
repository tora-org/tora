import { AbstractConstructor, Injector } from '../core'
import { ApiMethod } from '../http'
import { TaskDesc } from '../schedule'
import { ClassMethod } from '../types'
import { Platform } from './platform'

export class DebugPlatform extends Platform {

    /**
     * 列出全部 API 列表。
     *
     * @param formatter 自定义格式处理函数。
     */
    show_api_list(formatter?: (method: ApiMethod, path: string) => string) {
        const handler_list = this.server.list()
        console.log('\nUsable API list:')
        for (const desc of handler_list) {
            console.log(formatter?.(desc.method, desc.path) ?? `    ${desc.method.padEnd(7)} ${desc.path}`)
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
     * 暴露 root_injector，允许直接调用服务，一般用于测试
     */
    call<RES>(executor: (injector: Injector) => RES): RES {
        return executor(this.root_injector)
    }

    /**
     * 向外暴露指定 ToraService，一般用于测试
     */
    expose_service<T extends object>(target: AbstractConstructor<T>): T | undefined {
        return this.root_injector.get(target)?.create()
    }

    /**
     * 向外暴露指定 ToraService 的一个 method，一般用于测试
     */
    expose_service_method<T extends object, P extends ClassMethod<T>>(target: AbstractConstructor<T>, prop: P): { (...args: Parameters<T[P]>): ReturnType<T[P]> } {
        const executor = this.root_injector.get(target)?.create()
        if (!executor) {
            return undefined as any
        }
        const method = executor[prop] as Function
        if (typeof method !== 'function') {
            return undefined as any
        }
        return method?.bind(executor)
    }
}
