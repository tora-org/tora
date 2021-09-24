export class JudgementUtil<T extends (...args: any[]) => boolean> {
    constructor(
        public check: T
    ) {
    }
}

export namespace Jtl {
    export function greater_than(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target > value)
    }

    export function greater_than_or_equal(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target >= value)
    }

    export function less_than(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target < value)
    }

    export function less_than_or_equal(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target <= value)
    }

    export function equal(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target === value)
    }

    export function not_equal(value: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target !== value)
    }

    export function between(start: number, end: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && start <= target && target <= end)
    }

    export function be_included_with(arr: number[]) {
        return new JudgementUtil((target: any) => typeof target === 'number' && arr.includes(target))
    }

    export function multiple_of(factor: number) {
        return new JudgementUtil((target: any) => typeof target === 'number' && target % factor === 0)
    }

    export const $mx = multiple_of
    export const $btw = between
    export const $in = be_included_with
    export const $gt = greater_than
    export const $ge = greater_than_or_equal
    export const $lt = less_than
    export const $le = less_than_or_equal
    export const $eq = equal
    export const $ne = not_equal
}
