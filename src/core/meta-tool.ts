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
export function MetaWrapper<T = any>(metadata_key: string): (target: any, property_key?: string) => Meta<T | undefined> {
    return function (target: any, property_key?: string): Meta<T | undefined> {
        return new Meta<T | undefined>(metadata_key, target, property_key)
    }
}

export class Meta<T> {

    constructor(
        private metadata_key: string,
        private target: any,
        private property_key?: string,
    ) {
    }

    /**
     * 获取数据。
     */
    get value(): T {
        if (this.property_key === undefined) {
            return Reflect.getMetadata(this.metadata_key, this.target)
        } else {
            return Reflect.getMetadata(this.metadata_key, this.target, this.property_key)
        }
    }

    /**
     * 是否存在指定元数据。
     */
    exist(): boolean {
        if (this.property_key === undefined) {
            return Reflect.hasMetadata(this.metadata_key, this.target)
        } else {
            return Reflect.hasMetadata(this.metadata_key, this.target, this.property_key)
        }
    }

    /**
     * 设置元数据。
     *
     * @param value
     */
    set(value: T): this {
        if (this.property_key === undefined) {
            Reflect.defineMetadata(this.metadata_key, value, this.target)
        } else {
            Reflect.defineMetadata(this.metadata_key, value, this.target, this.property_key)
        }
        return this
    }

    /**
     * 设置元数据默认值。
     *
     * @param value
     */
    default(value: Exclude<T, undefined>): Meta<Exclude<T, undefined>> {
        if (!this.exist()) {
            if (this.property_key === undefined) {
                Reflect.defineMetadata(this.metadata_key, value, this.target)
            } else {
                Reflect.defineMetadata(this.metadata_key, value, this.target, this.property_key)
            }
        }
        return this as any
    }

    /**
     * do something。
     */
    do(something: (value: T) => T | void): T {
        const value = this.value
        return something(value) ?? value
    }

    /**
     * 清除元数据。
     */
    clear() {
        if (this.property_key === undefined) {
            Reflect.deleteMetadata(this.metadata_key, this.target)
        } else {
            Reflect.deleteMetadata(this.metadata_key, this.target, this.property_key)
        }
    }
}
