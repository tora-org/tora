import { Constructor, ImportsAndProviders, ProviderTreeNode } from '../annotation'
import { Injector } from '../injector'
import { def2Provider, Provider, ProviderDef } from '../provider'
import { TokenUtils } from '../token-utils'

/**
 * @private
 *
 * 加载模块及其子模块，注册 Provider。
 *
 * @param constructor
 * @param options
 */
export function make_provider_collector(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenUtils.ensure_component(md, 'ToraModuleLike').value
            return module_meta.provider_collector(injector)
        }) ?? []

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Constructor<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}
