import { AbstractConstructor, Injector } from '../core'
import { ClassMethod } from '../types'
import { Platform } from './platform'

export class DebugPlatform extends Platform {

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
