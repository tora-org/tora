/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TaskDescriptor } from '../types'
import { Bullet } from './bullet'
import { Schedule } from './schedule'

/**
 * 任务描述对象
 */
export interface TaskDesc {
    /**
     * 任务 ID
     */
    id: string
    /**
     * 任务名称
     */
    name: string
    /**
     * 任务位置，格式为 类名.方法名
     */
    pos: string
    /**
     * 任务的 crontab 描述
     */
    crontab: string
    /**
     * 任务的计划下次执行时间戳。
     */
    next_exec_ts: number
    /**
     * 任务的计划下次执行时间戳的日期格式。
     */
    next_exec_date_string: string
}

/**
 * ToraTrigger 的触发器。
 *
 * @category Schedule
 */
export class Revolver {

    private static id_cursor = 1
    private _clip?: Bullet | null
    private _suspended_task: { [id: string]: Bullet } = {}

    constructor() {
    }

    private static get_id(): string {
        const id = Revolver.id_cursor
        Revolver.id_cursor++
        return `bullet-${id}`
    }

    /**
     * @private
     */
    _fill(crontab: Schedule, handler: Function, desc: TaskDescriptor) {
        const bullet = new Bullet(Revolver.get_id(), crontab, handler, crontab.next(), null, desc)
        if (!this._clip) {
            this._clip = bullet
        } else if (bullet.execution.isBefore(this._clip.execution)) {
            bullet.next_bullet = this._clip
            this._clip = bullet
        } else {
            this.insert(this._clip, bullet)
        }
    }

    /**
     * @private
     */
    _shoot(timestamp: number) {
        if (!this._clip) {
            return
        }
        while (this._clip.execution.valueOf() <= timestamp) {
            this.execute()
        }
    }

    /**
     * 临时触发一个任务队列中的任务。
     *
     * 此操作会先将指定的任务移出队列，执行完毕后如果没有异常会添加回队列中。
     *
     * @param id 任务 ID
     */
    async interim(id: string) {
        let bullet = this._clip
        while (bullet && bullet?.id !== id) {
            bullet = bullet.next_bullet
        }
        if (!bullet) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
        this.suspend(bullet)
        try {
            await bullet.handler()
            this.renew(bullet)
        } catch (err) {
            console.log('on error', err)
        }
    }

    /**
     * 将因为异常被移出队列的任务，添加回队列中。
     *
     * @param id 任务 ID
     * @param run_first 是否在添加之前先运行一次
     */
    async renew_task(id: string, run_first?: boolean) {
        const bullet = this._suspended_task[id]
        if (!bullet) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
        if (run_first) {
            try {
                await bullet.handler(bullet.execution)
                this.renew(bullet)
            } catch (err) {
                console.log('on error', err)
            }
        } else {
            this.renew(bullet)
        }
    }

    /**
     * 获取挂起任务列表。
     */
    get_suspended_list(): TaskDesc[] {
        return Object.values(this._suspended_task).map(bullet => {
            return {
                id: bullet.id,
                name: bullet.desc.name ?? bullet.desc.pos ?? '',
                pos: bullet.desc.pos ?? '',
                crontab: bullet.desc.crontab ?? '',
                next_exec_ts: bullet.execution.valueOf(),
                next_exec_date_string: bullet.execution.format(),
            }
        })
    }

    /**
     * 获取任务队列中的任务列表。
     */
    get_task_list() {
        const list: TaskDesc[] = []
        let bullet = this._clip
        while (bullet) {
            list.push({
                id: bullet.id,
                name: bullet.desc.name ?? bullet.desc.pos ?? '',
                pos: bullet.desc.pos ?? '',
                crontab: bullet.desc.crontab ?? '',
                next_exec_ts: bullet.execution.valueOf(),
                next_exec_date_string: bullet.execution.format(),
            })
            bullet = bullet.next_bullet
        }
        return list
    }

    /**
     * 重启一个任务
     *
     * @param bullet
     * @private
     */
    private renew(bullet: Bullet) {
        delete this._suspended_task[bullet.id]
        const now = new Date().getTime()
        while (bullet.execution.valueOf() < now) {
            bullet.execution = bullet.crontab.next()
        }
        if (!this._clip) {
            this._clip = bullet
        } else if (bullet.execution.isBefore(this._clip.execution)) {
            bullet.next_bullet = this._clip
            this._clip = bullet
        } else {
            this.insert(this._clip, bullet)
        }
    }

    /**
     * 挂起一个任务。
     *
     * @param clip
     * @private
     */
    private suspend(clip: Bullet) {
        if (!this._clip) {
            return
        } else if (this._clip === clip) {
            this._clip = clip.next_bullet
            this._suspended_task[clip.id] = clip
        } else {
            this.remove(this._clip, clip)
            this._suspended_task[clip.id] = clip
        }
    }

    /**
     * 执行一个任务。
     *
     * @private
     */
    private execute() {
        if (!this._clip) {
            return
        }
        const execution = this._clip.execution
        this._clip.execution = this._clip.crontab.next()
        const clip = this._clip
        this._clip.handler(execution).catch((err: any) => {
            console.log('on error', err)
            this.suspend(clip)
        })
        if (this._clip.next_bullet && this._clip.next_bullet.execution.isBefore(this._clip.execution)) {
            const bullet = this._clip
            this._clip = bullet.next_bullet!
            bullet.next_bullet = null
            this.insert(this._clip, bullet)
        }
    }

    /**
     * 插入一个任务。
     *
     * @param clip
     * @param bullet
     * @private
     */
    private insert(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            clip.next_bullet = bullet
        } else if (bullet.execution.isBefore(clip.next_bullet.execution)) {
            bullet.next_bullet = clip.next_bullet
            clip.next_bullet = bullet
        } else {
            this.insert(clip.next_bullet, bullet)
        }
    }

    /**
     * 移除一个任务。
     *
     * @param clip
     * @param bullet
     * @private
     */
    private remove(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            return
        } else if (clip.next_bullet === bullet) {
            clip.next_bullet = bullet.next_bullet
            bullet.next_bullet = null
            return
        } else {
            this.remove(clip.next_bullet, bullet)
        }
    }
}
