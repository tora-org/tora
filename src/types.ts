/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.

 * @module
 * @category Namespace
 */

/**
 * 通过全局声明合并扩展 ToraConfigSchema。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category ConfigSchema
 */
export interface ToraConfigSchema {
    tora?: {
        port?: number
    }
}

export interface ToraSession {

}

export interface ToraAuthInfo {

}

export type ToraEvent =
    | 'tora-destroy'

export type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never
}[keyof T]

export type ClassMethod<T> = KeyOfFilterType<T, Function>


