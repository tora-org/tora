/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TriggerFunction } from '../core'

export class Bullet {

    public crontab = this.desc.schedule
    public execution = this.desc.schedule.next()
    public next_bullet: Bullet | null = null

    constructor(
        public id: string,
        public handler: Function,
        public desc: TriggerFunction<any>,
    ) {
    }
}
