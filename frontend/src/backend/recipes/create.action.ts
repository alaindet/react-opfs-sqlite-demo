import { CreateRecipeDto, Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { IMAGE_MAX_DIMENSION, IMAGE_QUALITY, ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesCreateAction = (
  db: RecipesDatabaseMock,
  images: ImagesController,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.CREATE,
  async handle(
    req: WorkerRequest<CreateRecipeDto>,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse<Recipe>
    | WorkerErrorResponse
  )> {
    const dto = req.data;
    const existing = await db.getByTitle(dto.title);

    if (existing) {
      const message = `A recipe with title "${dto.title}" already exists`;
      return res.asyncError(message, dto);
    }

    // Sync the fs
    let imageFile!: File;
    try {
      imageFile = await images.saveImage(
        dto.imageFile.name,
        dto.imageFile,
        { maxSize: IMAGE_MAX_DIMENSION, quality: IMAGE_QUALITY },
      );
    } catch (error) {
      const message = 'Cannot store image';
      const data = { error, filename: dto.imageFile.name };
      logger.error(message, data);
      res.error(message, data);
    }

    // Sync the db
    const recipe: Recipe = {
      id: String(Math.random()),
      createdAt: Date.now(),
      title: dto.title,
      description: dto.description,
      imageFile,
    };

    try {
      await db.create(recipe);
    } catch (error) {
      const message = 'Cannot save recipe into database';
      const data = { error, recipe };
      logger.error(message, data);
      return res.error(message, data);
    }

    const message = `Created recipe "${recipe.title}"`;
    return res.asyncSuccess(message, recipe);
  },
});
