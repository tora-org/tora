import { LiteContext } from '../http'

/**
 * @category Error
 */
export class ReasonableError extends Error {

    constructor(readonly code: number, readonly msg: string, readonly detail?: any) {
        super(msg)
    }

    toJson() {
        return {
            code: this.code,
            msg: this.msg,
            detail: this.detail
        }
    }
}

/**
 * @category Error
 */
export class InnerFinish<Context extends LiteContext = LiteContext> extends Error {

    constructor(private response_body: any) {
        super('')
    }

    get body() {
        return this.response_body
    }
}

/**
 * @category Error
 */
export class OuterFinish<Context extends LiteContext = LiteContext> extends Error {

    constructor(private _ctx: Context, private response_body: any) {
        super('')
    }

    get body() {
        return this.response_body
    }

    get ctx() {
        return this._ctx
    }
}

export class ToraError<T> {

    public readonly err_data: any
    public readonly err_type: 'reasonable' | 'crash'

    constructor(public readonly err: T) {
        if (err instanceof ReasonableError) {
            this.err_type = 'reasonable'
            this.err_data = err.toJson()
        } else if (err instanceof Error) {
            this.err_type = 'crash'
            this.err_data = { msg: err.message + '\n' + err.stack }
        } else if (err instanceof String) {
            this.err_type = 'crash'
            this.err_data = { msg: err.toString() }
        } else if (typeof err === 'string') {
            this.err_type = 'crash'
            this.err_data = { msg: err }
        } else {
            this.err_type = 'crash'
            this.err_data = err
        }
    }
}
