/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Schedule, ScheduleOptions } from '../../schedule'
import { TaskDescriptor } from '../../types'
import { TokenUtils } from '../token-utils'

/**
 * 将 Tora.ToraTrigger 中的一个方法标记为一个任务。
 *
 * @category Trigger Annotation
 *
 * @param crontab 任务计划
 * @param options
 * @constructor
 */
export function Task(crontab: string, options?: ScheduleOptions) {
    return function(target: any, key: string, desc: PropertyDescriptor) {

        if (TokenUtils.ToraTriggerTask.has(target, key)) {
            throw new Error(`Decorator @Task duplicated on method ${key}.`)
        }

        const task: TaskDescriptor = {}
        task.crontab = crontab
        task.name = options?.name
        task.schedule = Schedule.parse(crontab, options)
        task.property_key = key
        task.handler = desc.value
        const inject_token_map = TokenUtils.ParamInjection.get(target, key)
        task.param_types = TokenUtils.getParamTypes(target, key)
            ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)

        TokenUtils.ToraTriggerTask.set(target, key, task)

        const tasks = TokenUtils.ToraTriggerTaskList.getset(target, [])
        if (!tasks.includes(task)) {
            tasks.push(task)
        }
    }
}
