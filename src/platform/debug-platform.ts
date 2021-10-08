import { AbstractConstructor, Injector, ValueProvider } from '../core'
import { ToraServer } from '../http'
import { Revolver } from '../schedule'
import { ClassMethod } from '../types'
import { Platform } from './platform'

export class DebugPlatform extends Platform {

    constructor() {
        super()
        this.root_injector.set_provider(Platform, new ValueProvider('Platform', this))
        this.root_injector.set_provider(Revolver, new ValueProvider('Revolver', this.revolver))
        this.root_injector.set_provider(ToraServer, new ValueProvider('ToraServer', this.server))
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
