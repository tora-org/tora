import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

export function Worker(worker_options: { channel: string }): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.PropertyMeta(prototype, prop)
            .ensure_default()
            .do(meta => {
                meta.worker = worker_options
            })
    }
}
