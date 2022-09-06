import { ENTITY_OPTS_PROP, IModelClass } from '@briebug/ngrx-auto-entity';

export const resolveState = <Model>(
  type: IModelClass<Model> & { [ENTITY_OPTS_PROP]?: any }
) => {
  const modelName = type[ENTITY_OPTS_PROP].modelName as string;
  const stateName = modelName.substr(0, 1).toLowerCase() + modelName.substr(1);
  const getState = (state: Record<string, any>) => state[stateName];
  return getState;
};
