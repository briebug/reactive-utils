import { checkKeyName, ENTITY_OPTS_PROP, IEntityInfo, IEntityOptions } from '@briebug/ngrx-auto-entity';
import { ActionCreator, createAction, Creator, props } from '@ngrx/store';
import { GenericFile } from './models/generic-file';
import { PendingFile } from './models/pending-file';

export type EntityCriteria = any;

// tslint:disable
export const uuid = (a?: any, b?: any) => {
  for (
    b = a = '';
    a++ < 36;
    b += (a * 51) & 52 ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16) : '-'
  );
  return b;
};
// tslint:enable
export const setInfo = (type: any): IEntityInfo => {
  if (type) {
    const instance = new type();
    const opts = (type[ENTITY_OPTS_PROP] || { modelName: instance.constructor.name }) as IEntityOptions;
    const modelName = opts.modelName;
    checkKeyName(type, modelName);
    return {
      modelType: type,
      ...opts,
    };
  } else {
    return { modelName: 'null', modelType: String };
  }
};

export function defineTypedFactoryFunction<T extends string, C extends Creator, TAction extends ActionCreator<T, C>>(
  type: T,
  genericType: string,
  creator: C
): TAction & { genericType: string } {
  Object.defineProperty(creator, 'genericType', { value: genericType, writable: false });
  return Object.defineProperty(creator, 'type', {
    value: type,
    writable: false,
  }) as TAction & { genericType: string };
}

export const FileActionTypes = {
  Upload: '[File] (GenericFile) Upload',
  UploadRetry: '[File] (GenericFile) Upload Retry',
  UploadSuccess: '[File] (GenericFile) Upload Success',
  UploadProgress: '[File] (GenericFile) Upload Progress',
  UploadFailure: '[File] (GenericFile) Upload Failure',
  Delete: '[File] (GenericFile) Delete',
  DeleteSuccess: '[File] (GenericFile) Delete Success',
  DeleteFailure: '[File] (GenericFile) Delete Failure',
  RemovePending: '[File] (GenericFile) Remove Pending',
} as const;

export interface BaseProps {
  info: IEntityInfo;
  correlationId: string;
  genericType: typeof FileActionTypes[keyof typeof FileActionTypes];
}

export interface UploadActionProps extends BaseProps {
  pendingFile: PendingFile;
  criteria: EntityCriteria;
  skipAPISuccessCall?: boolean;
}

export const uploadFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Upload`,
    FileActionTypes.Upload,
    ({
      pendingFile,
      criteria,
      skipAPISuccessCall,
    }: {
      pendingFile: PendingFile;
      criteria: EntityCriteria;
      skipAPISuccessCall?: boolean;
    }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Upload`,
        props<UploadActionProps>()
      )({
        info: setInfo(model),
        pendingFile,
        criteria,
        correlationId: uuid(),
        skipAPISuccessCall,
        genericType: FileActionTypes.Upload,
      })
  );

export interface UploadRetryActionProps {
  info: IEntityInfo;
  pendingFile: PendingFile;
  criteria: EntityCriteria;
  skipAPISuccessCall?: boolean;
  genericType: string;
}

export const uploadRetryFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Retry`,
    FileActionTypes.UploadRetry,
    ({
      pendingFile,
      criteria,
      skipAPISuccessCall,
    }: {
      pendingFile: PendingFile;
      criteria: EntityCriteria;
      skipAPISuccessCall?: boolean;
    }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Retry`,
        props<UploadRetryActionProps>()
      )({ info: setInfo(model), pendingFile, criteria, skipAPISuccessCall, genericType: FileActionTypes.UploadRetry })
  );

export interface UploadSuccessActionProps {
  info: IEntityInfo;
  pendingFile: PendingFile;
  criteria: EntityCriteria;
  genericType: string;
}

export const uploadSuccessFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Upload Success`,
    FileActionTypes.UploadSuccess,
    ({ pendingFile, criteria }: { pendingFile: PendingFile; criteria: EntityCriteria }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Upload Success`,
        props<UploadSuccessActionProps>()
      )({ info: setInfo(model), pendingFile, criteria, genericType: FileActionTypes.UploadSuccess })
  );

export interface UploadProgress {
  loaded: number;
  total?: number;
}

export interface UploadProgressActionProps {
  info: IEntityInfo;
  pendingFile: PendingFile;
  progress: UploadProgress;
  genericType: string;
}

export const uploadProgressFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Upload Progress`,
    FileActionTypes.UploadProgress,
    ({ pendingFile, progress }: { pendingFile: PendingFile; progress: UploadProgress }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Upload Progress`,
        props<UploadProgressActionProps>()
      )({ info: setInfo(model), pendingFile, progress, genericType: FileActionTypes.UploadProgress })
  );

export interface UploadFailureActionProps {
  info: IEntityInfo;
  pendingFile: PendingFile;
  error: any;
  genericType: string;
}

export const uploadFailureFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Upload Failure`,
    FileActionTypes.UploadFailure,
    ({ pendingFile, error }: { pendingFile: PendingFile; error: any }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Upload Failure`,
        props<UploadFailureActionProps>()
      )({ info: setInfo(model), pendingFile, error, genericType: FileActionTypes.UploadFailure })
  );

export interface DeleteActionProps {
  info: IEntityInfo;
  file: GenericFile & { correlationId?: string };
  criteria: EntityCriteria;
  correlationId: string;
  genericType: string;
}

export const deleteFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Delete`,
    FileActionTypes.Delete,
    ({ file, criteria }: { file: GenericFile & { correlationId?: string }; criteria: EntityCriteria }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Delete`,
        props<DeleteActionProps>()
      )({ info: setInfo(model), file, criteria, correlationId: uuid(), genericType: FileActionTypes.Delete })
  );

export interface RemovePendingActionProps {
  info: IEntityInfo;
  pendingFile: GenericFile & { correlationId?: string };
  criteria: EntityCriteria;
  correlationId: string;
  genericType: string;
}

export const removePendingFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Remove Pending`,
    FileActionTypes.RemovePending,
    ({
      pendingFile,
      criteria,
      correlationId,
    }: {
      pendingFile: GenericFile & { correlationId?: string };
      criteria: EntityCriteria;
      correlationId: string;
    }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Remove Pending`,
        props<RemovePendingActionProps>()
      )({ info: setInfo(model), pendingFile, criteria, correlationId, genericType: FileActionTypes.RemovePending })
  );

export interface DeleteSuccessActionProps {
  info: IEntityInfo;
  file: GenericFile;
  criteria: EntityCriteria;
  correlationId: string;
  genericType: string;
}

export const deleteSuccessFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Delete Success`,
    FileActionTypes.DeleteSuccess,
    ({ file, criteria, correlationId }: { file: GenericFile; criteria: EntityCriteria; correlationId?: string }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Delete Success`,
        props<DeleteSuccessActionProps>()
      )({ info: setInfo(model), file, criteria, correlationId, genericType: FileActionTypes.DeleteSuccess })
  );

export interface DeleteFailureActionProps {
  info: IEntityInfo;
  file: GenericFile;
  error: any;
  correlationId: string;
  genericType: string;
}

export const deleteFailureFactory = <T>(model: T) =>
  defineTypedFactoryFunction(
    `[${setInfo(model).modelName}] (GenericFile) Delete Failure`,
    FileActionTypes.DeleteFailure,
    ({ file, error, correlationId }: { file: GenericFile; error: any; correlationId?: string }) =>
      createAction(
        `[${setInfo(model).modelName}] (GenericFile) Delete Failure`,
        props<DeleteFailureActionProps>()
      )({ info: setInfo(model), file, error, correlationId, genericType: FileActionTypes.DeleteFailure })
  );
