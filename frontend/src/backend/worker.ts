import { RecipesDatabaseMock } from './database.mock';
import { IMAGES_DIR, ImagesController } from './images';
import { ConsoleLogger } from './logger';
import { OpfsDirectoryController } from './opfs/dir.controller';
import { recipesMock } from './recipes.mock';
import { createRecipesActions } from './recipes/routes';
import { WorkerRequest, WorkerRequestHandler, WorkerRequestRouter, WorkerResponder } from './worker-message-broker';

// State
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ready = false;
let startingUp = false;
let pendingRequests: WorkerRequest[] = [];

// Dependencies
const logger = new ConsoleLogger('Backend');
let router!: WorkerRequestRouter;
let db!: RecipesDatabaseMock;
let fs!: OpfsDirectoryController;
let images!: ImagesController;

// TODO: Replace the message handler after initialization
// Bootstrap
ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {

  // Pile up pending requests while initializing
  if (!ready && !startingUp) {
    pendingRequests.push(event.data);
    return;
  }

  // Resolve pending requests
  if (ready && startingUp) {
    for (const req of pendingRequests) {
      await handleRequest(req);
    }
    startingUp = false;
  }

  // Handle the request normally
  handleRequest(event.data);
};

await init();
ready = true;
startingUp = true;
logger.info(`${logger.name} started`);

async function handleRequest(req: WorkerRequest) {
  logger.trace('Worker request', req);
  const handler = router.get(req.action);

  if (!handler) {
    logger.error('Missing worker action handler', { action: req.action });
    return;
  }

  const responder = new WorkerResponder(req);
  const res = await handler(req, responder);

  logger.trace('Worker response', res);
  if (res.error) {
    logger.warn('Worker error response', res);
  }

  ctx.postMessage(res);
}

async function init() {
  db = new RecipesDatabaseMock(recipesMock);
  fs = await OpfsDirectoryController.fromRoot();
  images = await ImagesController.fromPath(fs, IMAGES_DIR);
  router = new Map<string, WorkerRequestHandler>([
    ...createRecipesActions(db, images, logger),
    // Add action handlers here...
  ].map(route => [route.action, route.handle]));
}