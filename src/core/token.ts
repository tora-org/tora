/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'reflect-metadata'

/**
 * @private
 * 用于通过反射存取数据的 metadataKey 集合。
 */
export enum DI_TOKEN {

    // user custom metadata
    custom_data = 'lazor:custom_data',
    class_meta = 'lazor:class_meta',

    // inner metadata
    class_type = 'lazor:class_type',
    dependencies = 'lazor:dependencies',
    disabled_meta = 'lazor:disabled_meta',
    instance = 'lazor:instance',
    lock_meta = 'lazor:lock_meta',
    param_injection = 'lazor:param_injection',

    // ToraService
    tora_service_name = 'lazor:tora_service_name',
    tora_service_property = 'lazor:tora_service_property',

    // ToraModule
    tora_module_provider_collector = 'lazor:tora_module_provider_collector',
    tora_module_routers = 'lazor:tora_module_routers',
    tora_module_tasks = 'lazor:tora_module_tasks',

    // ToraTrigger
    tora_trigger_options = 'lazor:tora_trigger_options',
    tora_trigger_task = 'lazor:tora_trigger_task',
    tora_trigger_task_collector = 'lazor:tora_trigger_task_collector',
    tora_trigger_task_list = 'lazor:tora_trigger_task_list',

    // ToraRouter
    tora_router_absolute_path = 'lazor:tora_router_absolute_path',
    tora_router_handler = 'lazor:tora_router_handler',
    tora_router_handler_collector = 'lazor:tora_router_handler_collector',
    tora_router_handler_list = 'lazor:tora_router_handler_list',
    tora_router_options = 'lazor:tora_router_options',
    tora_router_path_replacement = 'lazor:tora_router_path_replacement',
}
