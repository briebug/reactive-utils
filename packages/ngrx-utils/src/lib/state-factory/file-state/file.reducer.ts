import { EntityActions, stateNameFromAction } from '@briebug/ngrx-auto-entity';
import { Action, ActionCreator, ActionReducer } from '@ngrx/store';
import { OnReducer, ReducerTypes } from '@ngrx/store/src/reducer_creator';
import { createGenericReducer, onGeneric } from '../utils.reducer';
import { GenericFile } from './models/generic-file';
import { PendingFile } from './models/pending-file';
import { initialFileState } from './file-state';
import {
  deleteFactory,
  deleteFailureFactory,
  deleteSuccessFactory,
  FileActionTypes,
  removePendingFactory,
  uploadFactory,
  uploadFailureFactory,
  uploadProgressFactory,
  uploadRetryFactory,
  uploadSuccessFactory,
} from './file.actions';

export const updatePendingFile = (
  pendingUploads: PendingFile[],
  pendingFile: PendingFile,
  update: (pendingFile: PendingFile) => PendingFile
): PendingFile[] => {
  const index = pendingUploads.findIndex(upload => upload.correlationId === pendingFile.correlationId);
  return pendingUploads.length === 1
    ? [update(pendingUploads[index])]
    : [...pendingUploads.slice(0, index), update(pendingUploads[index]), ...pendingUploads.slice(index + 1)];
};

export const filterPendingUploads = (pendingUploads: PendingFile[], entity: GenericFile & { correlationId?: string }) =>
  pendingUploads.filter(pending => pending.correlationId !== entity.correlationId);



const reduce = createGenericReducer(
  initialFileState,
  onGeneric(uploadFactory(null), (state, { pendingFile, correlationId }) => ({
    ...state,
    pendingUploads: [
      ...filterPendingUploads(state.pendingUploads, pendingFile),
      { ...pendingFile, correlationId, failed: false, progress: {} },
    ],
  })),
  onGeneric(uploadRetryFactory(null), (state, { pendingFile }) => ({
    ...state,
    pendingUploads: [...filterPendingUploads(state.pendingUploads, pendingFile), { ...pendingFile, failed: false }],
  })),
  onGeneric(uploadProgressFactory(null), (state, { pendingFile, progress }) => ({
    ...state,
    pendingUploads: updatePendingFile(state.pendingUploads, pendingFile, file => ({ ...file, progress })),
  })),
  onGeneric(uploadSuccessFactory(null), removePendingFactory(null), (state, { pendingFile }) => ({
    ...state,
    pendingUploads: filterPendingUploads(state.pendingUploads, pendingFile),
  })),
  onGeneric(uploadFailureFactory(null), (state, { pendingFile }) => ({
    ...state,
    pendingUploads: updatePendingFile(state.pendingUploads, pendingFile, file => ({ ...file, failed: true })),
  })),
  onGeneric(deleteFactory(null), (state, { file }) => ({
    ...state,
    pendingDelete: [...state.pendingDelete, ...(file?.id ? [file.id] : [])],
  })),
  onGeneric(deleteSuccessFactory(null), deleteFailureFactory(null), (state, { file }) => ({
    ...state,
    pendingDelete: state.pendingDelete.filter(id => id !== file.id),
  }))
);

export function fileEntityReducer(reducer: ActionReducer<any>, state, action: EntityActions<any>) {
  let stateName: string;
  let featureName: string;
  let entityState: any;
  let nextState: any;

  if (shouldReduceAction(action)) {
    stateName = stateNameFromAction(action);
    featureName = featureNameFromAction(action);
    entityState = featureName ? state[featureName][stateName] : state[stateName];

    const newState = reduce(entityState, action);

    nextState = setNewState(featureName, stateName, state, newState);
  }

  return reducer(nextState || state, action);
}

export function fileEntityMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action: EntityActions<any>) => {
    return fileEntityReducer(reducer, state, action);
  };
}
