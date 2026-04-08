import { RecipesDatabaseMock } from './database.mock';
import { ConsoleLogger } from './logger';
import { recipesMock } from './recipes.mock';
import { createRecipesActions } from './recipes/routes';
import { WorkerAction, WorkerRequest, WorkerRequestHandler, WorkerResponder } from './worker-message-broker';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// Setup dependencies
// TODO: Create OPFS abstraction
const recipesDb = new RecipesDatabaseMock(recipesMock);
const logger = new ConsoleLogger('Demo');

// Routes
const routes: WorkerAction[] = [
  ...createRecipesActions(recipesDb, logger),
];

const router = new Map<string, WorkerRequestHandler>(
  routes.map(route => [route.action, route.handle]),
);

// Bootstrap message listener
logger.info('Started backend worker');

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
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
};
