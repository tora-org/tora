/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TriggerFunction } from '../core'
import { Dora } from './dora'
import { Schedule } from './schedule'

export class Bullet {

    constructor(
        public id: string,
        public crontab: Schedule,
        public handler: Function,
        public execution: Dora,
        public next_bullet: Bullet | null,
        public desc: TriggerFunction<any>,
    ) {
    }
}
