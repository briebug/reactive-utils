import { EntityActions, stateNameFromAction } from '@briebug/ngrx-auto-entity';
import { IEntityAction } from '@briebug/ngrx-auto-entity/lib/actions/entity-action';
import { Action, ActionCreator, ActionReducer, MetaReducer } from '@ngrx/store';
import { OnReducer, ReducerTypes } from '@ngrx/store/src/reducer_creator';
import { FileActionTypes } from './file-state/file.actions';
import { GenericAction, GenericActionCreator } from './utils.actions';

export const FEATURE_AFFINITY = '__ngrxae_feature_affinity';

export function featureNameFromAction(action: EntityActions<any>): string {
  return (action.info.modelType as any)[FEATURE_AFFINITY];
}

export const onGeneric = <
  State,
  Creators extends readonly (ActionCreator & { genericType: string })[]
>(
  ...args: [...Creators, OnReducer<State extends infer S ? S : never, Creators>]
): ReducerTypes<State, Creators> => {
  const [reducer]: OnReducer<State, Creators>[] = args.slice(-1) as any;
  const types = (args.slice(0, -1) as any as Creators).map(
    (creator: Creators[number]) => creator.genericType
  );
  return {
    reducer,
    types,
  } as any;
};

export const createGenericReducer =
  <State, A extends GenericAction = GenericAction>(
    initialState: State,
    ...ons: ReducerTypes<State, GenericActionCreator[]>[]
  ): ActionReducer<State, A> =>
  (state = initialState, action: A): State =>
    ons.reduce(
      (acc: State, currentOn): State =>
        (action?.genericType && currentOn.types.includes(action.genericType)
          ? currentOn.reducer(acc, action)
          : acc) as State,
      state
    );

export const shouldReduceAction = (
  action: GenericAction
): action is IEntityAction =>
  Object.values(FileActionTypes).includes(action.genericType as any);

export const stateIsRecord = (
  state: Record<string, any> | undefined
): state is Record<string, any> => !!state && typeof state === 'object';

export const setNewState = (
  featureName: string,
  stateName: string,
  state: Record<string, any>,
  newState: Record<string, any>
) =>
  featureName
    ? {
        ...state,
        [featureName]: { ...state[featureName], [stateName]: newState },
      }
    : { ...state, [stateName]: newState };

export const createGenericMetaReducer =
  <T, U>(genericReducer: (state: T, action: Action) => T): MetaReducer<U> =>
  (reducer: ActionReducer<U>): ActionReducer<U> =>
  (state: U | undefined, action: GenericAction) => {
    let stateName: string;
    let featureName: string;
    let entityState: any;
    let nextState: any;

    if (shouldReduceAction(action)) {
      stateName = stateNameFromAction(action);
      featureName = featureNameFromAction(action);
      entityState = stateIsRecord(state)
        ? featureName
          ? (state as any)?.[featureName][stateName]
          : (state as any)?.[stateName]
        : state;

      const newState = genericReducer(entityState, action);

      nextState = setNewState(featureName, stateName, state || {}, newState);
    }

    return reducer(nextState || state, action);
  };
