import { buildState, EntityIdentity, IModelClass, ISelectorMap } from '@briebug/ngrx-auto-entity';
import { ActionCreator, MemoizedSelector } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { GenericFile } from './models/generic-file';
import { PendingFile } from './models/pending-file';
import { FileState, initialFileState } from './file-state';
import {
  BaseProps,
  DeleteActionProps,
  deleteFactory,
  DeleteFailureActionProps,
  deleteFailureFactory,
  DeleteSuccessActionProps,
  deleteSuccessFactory,
  UploadActionProps,
  uploadFactory,
  UploadFailureActionProps,
  uploadFailureFactory,
  UploadRetryActionProps,
  uploadRetryFactory,
  UploadSuccessActionProps,
  uploadSuccessFactory,
} from './file.actions';
import {
  ProcessingFile,
  selectPendingDeleteFactory,
  selectPendingFilesFactory,
  selectPendingUploadsFactory,
} from './file.selectors';
import { resolveState } from '../utils';

export interface FileActions {
  upload: ActionCreator<
    string,
    (props: Omit<UploadActionProps, keyof BaseProps>) => UploadActionProps & TypedAction<string>
  >;
  uploadRetry: ActionCreator<
    string,
    (props: Omit<UploadRetryActionProps, keyof BaseProps>) => UploadRetryActionProps & TypedAction<string>
  >;
  uploadSuccess: ActionCreator<
    string,
    (props: Omit<UploadSuccessActionProps, keyof BaseProps>) => UploadSuccessActionProps & TypedAction<string>
  >;
  uploadFailure: ActionCreator<
    string,
    (props: Omit<UploadFailureActionProps, keyof BaseProps>) => UploadFailureActionProps & TypedAction<string>
  >;
  delete: ActionCreator<
    string,
    (props: Omit<DeleteActionProps, keyof BaseProps>) => DeleteActionProps & TypedAction<string>
  >;
  deleteSuccess: ActionCreator<
    string,
    (props: Omit<DeleteSuccessActionProps, keyof BaseProps>) => DeleteSuccessActionProps & TypedAction<string>
  >;
  deleteFailure: ActionCreator<
    string,
    (props: Omit<DeleteFailureActionProps, keyof BaseProps>) => DeleteFailureActionProps & TypedAction<string>
  >;
}

export interface FileSelectors<T extends GenericFile> {
  selectPendingUploads: MemoizedSelector<object, ProcessingFile<PendingFile>[]>;
  selectPendingDelete: MemoizedSelector<object, EntityIdentity[]>;
  selectPendingFiles: MemoizedSelector<unknown, ProcessingFile<T>[]>;
}

export interface BuiltFileState<T extends GenericFile> {
  fileActions: FileActions;
  fileSelectors: FileSelectors<T>;
}

const buildFileSelectors = <Model extends GenericFile, ParentState>(
  type: IModelClass<Model>,
  selectors: ISelectorMap<ParentState, Model>
): FileSelectors<Model> => {
  const getState = resolveState(type);
  const fileSelectors = {
    selectPendingUploads: selectPendingUploadsFactory(getState),
    selectPendingDelete: selectPendingDeleteFactory(getState),
  };
  return {
    ...fileSelectors,
    selectPendingFiles: selectPendingFilesFactory(
      fileSelectors.selectPendingUploads,
      fileSelectors.selectPendingDelete,
      selectors.selectAll
    ),
  };
};

export const buildFileState = <Model extends GenericFile, ExtraState>(
  type: IModelClass<Model>,
  extraInitialState?: ExtraState
) => {
  const autoEntityState = buildState(type, {
    ...extraInitialState,
    ...initialFileState,
  } as ExtraState & FileState<Model>);

  const fileState: BuiltFileState<Model> = {
    fileActions: {
      upload: uploadFactory(type),
      uploadRetry: uploadRetryFactory(type),
      uploadSuccess: uploadSuccessFactory(type),
      uploadFailure: uploadFailureFactory(type),
      delete: deleteFactory(type),
      deleteSuccess: deleteSuccessFactory(type),
      deleteFailure: deleteFailureFactory(type),
    },
    fileSelectors: buildFileSelectors(type, autoEntityState.selectors),
  };
  return {
    ...autoEntityState,
    ...fileState,
  };
};
