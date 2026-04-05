import { BackendWorker } from '@recipe-app/backend';

const _self = self as unknown as DedicatedWorkerGlobalScope;
new BackendWorker(_self);
export default _self;