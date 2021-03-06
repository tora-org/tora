/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraConfigSchema } from '../types'
import { Path, PathValue, Reference } from './judgement'

/**
 * 内置的全局配置内容查找服务。
 *
 * 通过调用 [[Platform.load_config]] 可以加载配置文件，并将配置内容保存到 "ConfigData" 中。
 *
 * NPM 包 [tora-check](https://www.npmjs.com/package/tora-check) 提供了一种检查位置文件是否符合类型 <ToraConfigSchema> 的方法。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category Builtin
 */
export class ConfigData extends Reference<ToraConfigSchema> {

    /**
     * @param data 配置文件内容。
     */
    constructor(
        data: ToraConfigSchema
    ) {
        super(data)
    }

    /**
     * 返回完整配置对象。
     */
    get<K extends Path<ToraConfigSchema>>(): ToraConfigSchema
    /**
     * 查找指定路径的配置。
     *
     * @param path JSON 路径。
     */
    get<K extends Path<ToraConfigSchema>>(path: K): PathValue<ToraConfigSchema, K>
    get<K extends Path<ToraConfigSchema>>(path?: K): PathValue<ToraConfigSchema, K> | ToraConfigSchema {
        if (!path) {
            return super.get()
        }
        return super.get(path)!
    }
}
