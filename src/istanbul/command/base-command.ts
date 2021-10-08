export abstract class BaseCommand {

    private _resolve?: (value: any | PromiseLike<any>) => void
    private _reject?: (reason?: any) => void

    set_promise(resolve: (value: any | PromiseLike<any>) => void, reject: (reason?: any) => void): this {
        this._resolve = resolve
        this._reject = reject
        return this
    }

    resolve(data: any | PromiseLike<any>) {
        if (!this._resolve) {
            throw new Error('No Resolve Function in Request Object.')
        }
        return this._resolve?.(data)
    }

    reject(err: Error) {
        if (!this._reject) {
            throw new Error('No Reject Function in Request Object.')
        }
        return this._reject?.(err)
    }
}
