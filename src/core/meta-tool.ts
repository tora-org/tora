/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @private
 * 通过 reflect-metadata 存取元数据的工具。
 */
export class MetaTool<T = any> {

    constructor(
        private metadataKey: string
    ) {
    }

    /**
     * 获取元数据。
     *
     * @param target
     * @param property_key
     */
    get(target: any, property_key?: string): T | undefined {
        if (property_key === undefined) {
            return Reflect.getMetadata(this.metadataKey, target)
        } else {
            return Reflect.getMetadata(this.metadataKey, target, property_key)
        }
    }

    /**
     * 是否存在指定元数据。
     * @param target
     * @param property_key
     */
    has(target: any, property_key?: string): boolean {
        if (property_key === undefined) {
            return Reflect.hasMetadata(this.metadataKey, target)
        } else {
            return Reflect.hasMetadata(this.metadataKey, target, property_key)
        }
    }

    /**
     * 获取元数据，如果不存在则设置一个默认值并返回。
     *
     * @param target
     * @param default_value
     */
    getset(target: any, default_value: T): T
    /**
     * 获取元数据，如果不存在则设置一个默认值并返回。
     *
     * @param target
     * @param property_key
     * @param default_value
     */
    getset(target: any, property_key: string, default_value: T): T
    getset(target: any, property_key?: string | T, default_value?: T): T {
        if (default_value === undefined) {
            default_value = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (!this.has(target, property_key)) {
            if (property_key === undefined) {
                Reflect.defineMetadata(this.metadataKey, default_value, target)
            } else {
                Reflect.defineMetadata(this.metadataKey, default_value, target, property_key)
            }
        }
        return this.get(target, property_key)!
    }

    /**
     * 设置元数据。
     *
     * @param target
     * @param options
     */
    set(target: any, options: T): void
    /**
     * 设置元数据。
     *
     * @param target
     * @param property_key
     * @param options
     */
    set(target: any, property_key: string | undefined, options: T): void
    set(target: any, property_key: T | string | undefined, options?: T): void {
        if (options === undefined) {
            options = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (property_key === undefined) {
            Reflect.defineMetadata(this.metadataKey, options, target)
        } else {
            Reflect.defineMetadata(this.metadataKey, options, target, property_key)
        }
    }

    /**
     * 如果元数据不存在则设置元数据，如果已经存在则抛出异常。
     *
     * @param target
     * @param options
     */
    setnx(target: any, options: T): void
    /**
     * 如果元数据不存在则设置元数据，如果已经存在则抛出异常。
     *
     * @param target
     * @param property_key
     * @param options
     */
    setnx(target: any, property_key: string | undefined, options: T): void
    setnx(target: any, property_key: T | string | undefined, options?: T): void {
        if (options === undefined) {
            options = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (this.get(target, property_key) !== undefined) {
            throw new Error(`Metadata "${this.metadataKey}" already exists and cannot be set repeatedly`)
        }
        if (property_key === undefined) {
            Reflect.defineMetadata(this.metadataKey, options, target)
        } else {
            Reflect.defineMetadata(this.metadataKey, options, target, property_key)
        }
    }

    /**
     * 检查指定元数据是否存在，不存在则抛出异常。
     *
     * @param target
     * @param property_key
     */
    ensure(target: any, property_key: string | undefined) {
        if (this.get(target, property_key) === undefined) {
            throw new Error(`Metadata "${this.metadataKey}" not exists.`)
        }
    }

    /**
     * 删除指定元数据。
     *
     * @param target
     * @param property_key
     */
    del(target: any, property_key?: string): void {
        if (property_key === undefined) {
            Reflect.deleteMetadata(this.metadataKey, target)
        } else {
            Reflect.deleteMetadata(this.metadataKey, target, property_key)
        }
    }
}

export type GenericTypeOfCustomMeta<T> = T extends MetaTool<infer P> ? P : never
