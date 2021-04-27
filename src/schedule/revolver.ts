/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TaskDescriptor } from '../types'
import { Bullet } from './bullet'
import { Schedule } from './schedule'

export interface TaskDesc {
    id: string
    name: string
    pos: string
    crontab: string
    next_exec_ts: number
    next_exec_date_string: string
}

export class Revolver {

    private _clip?: Bullet | null
    private _hang_task: { [id: string]: Bullet } = {}

    private static id_cursor = 1
    static get_id(): string {
        const id = Revolver.id_cursor
        Revolver.id_cursor++
        return `bullet-${id}`
    }

    constructor() {
    }

    fill(crontab: Schedule, handler: Function, desc: TaskDescriptor) {
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

    reload_task(id: string, run_first?: boolean) {
        const bullet = this._hang_task[id]
        if (!bullet) {
            return new Error(`No hang task found by ID: [${id}]`)
        }
        if (run_first) {
            bullet.handler(bullet.execution).then(() => {
                delete this._hang_task[id]
                this.push(bullet)
            }).catch((err: any) => {
                console.log('on error', err)
            })
        } else {
            delete this._hang_task[id]
            this.push(bullet)
        }
    }

    shoot(timestamp: number) {
        if (!this._clip) {
            return
        }
        while (this._clip.execution.valueOf() <= timestamp) {
            this.execute()
        }
    }

    get_hang_set(): TaskDesc[] {
        return Object.values(this._hang_task).map(bullet => {
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

    private push(bullet: Bullet) {
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

    private execute() {
        if (!this._clip) {
            return
        }
        const execution = this._clip.execution
        this._clip.execution = this._clip.crontab.next()
        const clip = this._clip
        this._clip.handler(execution).catch((err: any) => {
            console.log('on error', err)
            if (!this._clip) {
                return
            } else if (this._clip === clip) {
                this._clip = clip.next_bullet
                this._hang_task[clip.id] = clip
            } else {
                this.remove(this._clip, clip)
                this._hang_task[clip.id] = clip
            }
        })
        if (this._clip.next_bullet && this._clip.next_bullet.execution.isBefore(this._clip.execution)) {
            const bullet = this._clip
            this._clip = bullet.next_bullet!
            bullet.next_bullet = null
            this.insert(this._clip, bullet)
        }
    }

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
