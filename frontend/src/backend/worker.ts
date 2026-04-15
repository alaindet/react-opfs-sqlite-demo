import { initDatabase, DatabaseService } from './core/database';
import { seedDatabase } from './core/database/seed';
import { ImagesController } from './core/images';
import { ConsoleLogger } from './core/logger';
import { OpfsDirectoryController } from './core/opfs';
import { WorkerRequest, WorkerRequestHandler, WorkerRequestRouter, WorkerResponder, WorkerState, WORKER_STATE, WorkerResponse } from './core/worker-message-broker';
import { DATABASE_FILENAME, IMAGES_DIR } from './core/constants';
import { recipesRoutes } from './features/recipes';
import { backupRoutes } from './features/backup';

// State
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let workerState: WorkerState = WORKER_STATE.BOOTSTRAPPING;
let pendingRequests: WorkerRequest[] = [];

// Dependencies
const logger = new ConsoleLogger('Backend');
let router!: WorkerRequestRouter;
let fs!: OpfsDirectoryController;
let images!: ImagesController;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  logger.trace('Request', request);

  switch (workerState) {
    case WORKER_STATE.BOOTSTRAPPING:
    case WORKER_STATE.CATCHING_UP:
      pendingRequests.push(request);
      logger.trace('Enqueueing request', request);
      break;

    case WORKER_STATE.RUNNING:
      handleRequest(request);
      break;
  }
};

async function handleRequest(req: WorkerRequest) {
  const handler = router.get(req.action);

  if (!handler) {
    logger.error('Not found: Missing action handler', { action: req.action });
    return;
  }

  const responder = new WorkerResponder(req);
  let res!: WorkerResponse;

  try {
    res = await handler(req, responder);
    logger.trace('Response', res);
    if (res.error) logger.warn('Error response', res);
  } catch (err) {
    logger.error('Unhandled error in handler', { action: req.action, err });
    res = responder.error('Internal error', { req, err });
  }

  // If sending a binary or a stream of data, add it to the list of transferable
  // objects to avoid serializing/deserializing it (default behavior) when
  // passing through execution contexts (ex.: worker thread => main thread)
  if (!res.error && (res.binary || res.stream)) {
    ctx.postMessage(res, [res.data]);
    return;
  }

  ctx.postMessage(res);
}

(async function init() {

  logger.trace('Bootstrapping');

  // Init dependencies
  fs = await OpfsDirectoryController.fromRoot();

  // // TODO: Remove
  // await fs.empty();
  // logger.debug('Cleared all data');

  images = await ImagesController.fromPath(fs, IMAGES_DIR);
  const db = await initDatabase(logger, `/${DATABASE_FILENAME}`);
  await seedDatabase(db);
  const dbService = new DatabaseService(db);

  // Init router
  router = new Map<string, WorkerRequestHandler>([
    ...recipesRoutes(logger, dbService, images),
    ...backupRoutes(ctx, logger, dbService, fs),
    // Add routes here...
  ].map(route => [route.action, route.handle]));

  // Change worker state to catching up
  workerState = WORKER_STATE.CATCHING_UP;
  logger.trace('Bootstrapped. Catching up');

  // This is critical: it solves pending requests recursively until there's some
  // idle moment, then switches to running state
  while (pendingRequests.length > 0) {
    const batch = pendingRequests;
    pendingRequests = [];

    for (const req of batch) {
      logger.trace('Catching up request', req);
      await handleRequest(req);
    }
  }

  // Change worker state to running
  workerState = WORKER_STATE.RUNNING;
  logger.trace('Running');
})();
