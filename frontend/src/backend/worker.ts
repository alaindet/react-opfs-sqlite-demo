import { RecipesDatabaseMock } from './database.mock';
import { initDatabase } from './database/database';
import { seedDatabase } from './database/seed';
import { IMAGES_DIR, ImagesController } from './images';
import { ConsoleLogger } from './logger';
import { OpfsDirectoryController } from './opfs/dir.controller';
import { recipesMock } from './recipes.mock';
import { RecipesRepository } from './recipes/recipes.repository';
import { createRecipesActions } from './recipes/routes';
import { WorkerRequest, WorkerRequestHandler, WorkerRequestRouter, WorkerResponder, WorkerState, WORKER_STATE } from './worker-message-broker';

// State
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let workerState: WorkerState = WORKER_STATE.BOOTSTRAPPING;
let pendingRequests: WorkerRequest[] = [];

// Dependencies
const logger = new ConsoleLogger('Backend');
let router!: WorkerRequestRouter;
let recipesRepo!: RecipesDatabaseMock;
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

  try {
    const res = await handler(req, responder);
    logger.trace('Response', res);
    if (res.error) logger.warn('Error response', res);
    ctx.postMessage(res);
  } catch (err) {
    logger.error('Unhandled error in handler', { action: req.action, err });
    const res = responder.error('Internal error', { req, err });
    ctx.postMessage(res);
  }
}

(async function init() {

  logger.trace('Bootstrapping');

  // Init dependencies

  // TODO: Remove
  recipesRepo = new RecipesDatabaseMock(recipesMock);

  fs = await OpfsDirectoryController.fromRoot();

  // // TODO: Remove
  await fs.empty();
  logger.debug('Cleared all data');

  images = await ImagesController.fromPath(fs, IMAGES_DIR);

  const db = await initDatabase(logger, '/db.sqlite3');
  await seedDatabase(db);
  const repo = new RecipesRepository(logger, db, images);

  // TODO: Remove
  const recipes = await repo.getAll();
  logger.debug('recipes', recipes);

  // Init router
  router = new Map<string, WorkerRequestHandler>([
    ...createRecipesActions(recipesRepo, images, logger),
    // Add action handlers here...
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
