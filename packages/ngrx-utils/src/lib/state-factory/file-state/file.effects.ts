import { HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateSuccess,
  Delete,
  DeleteFailure,
  DeleteSuccess,
  EntityActionTypes,
  ofEntityType,
} from '@briebug/ngrx-auto-entity';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { of } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  mergeMap,
  take,
} from 'rxjs/operators';
import { ofGenericType } from '../effects-utils';
import {
  deleteFactory,
  deleteFailureFactory,
  deleteSuccessFactory,
  removePendingFactory,
  uploadFactory,
  uploadFailureFactory,
  uploadProgressFactory,
  uploadRetryFactory,
  uploadSuccessFactory,
} from './file.actions';
import { selectPendingUploadByCorrelationIdFactory } from './file.selectors';
import { FileService } from './file.service';
import { GenericFile } from './models/generic-file';
import { PendingFile } from './models/pending-file';
import { resolveState } from '../utils';

export const isProgressEvent = (
  event: HttpProgressEvent | PendingFile
): event is HttpProgressEvent =>
  !(event instanceof PendingFile) &&
  (event.type === HttpEventType.UploadProgress ||
    event.type === HttpEventType.DownloadProgress);

export const resolveCorrelationId = <
  T extends TypedAction<string> & {
    pendingFile?: PendingFile;
    correlationId?: string;
    genericType: string;
  }
>(
  action: T
) =>
  (action.genericType === uploadFactory(GenericFile).genericType &&
    action.correlationId) ||
  action.pendingFile?.correlationId;

@Injectable()
export class FileEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly fileUploader: FileService
  ) {}

  uploadPendingFile$ = createEffect(() =>
    this.actions$.pipe(
      ofGenericType(
        uploadFactory(GenericFile),
        uploadRetryFactory(GenericFile)
      ),
      mergeMap((action) =>
        this.fileUploader
          .uploadFile(
            action.info,
            action.pendingFile,
            action.criteria,
            action.skipAPISuccessCall
          )
          .pipe(
            map((entityOrEvent) =>
              isProgressEvent(entityOrEvent)
                ? uploadProgressFactory(action.info.modelType)({
                    pendingFile: {
                      ...action.pendingFile,
                      correlationId: resolveCorrelationId(action),
                    },
                    progress: entityOrEvent,
                  })
                : uploadSuccessFactory(action.info.modelType)({
                    pendingFile: {
                      ...entityOrEvent,
                      correlationId: resolveCorrelationId(action),
                    },
                    criteria: action.criteria,
                  })
            ),
            catchError((error) =>
              of(
                uploadFailureFactory(action.info.modelType)({
                  pendingFile: {
                    ...action.pendingFile,
                    correlationId: resolveCorrelationId(action),
                  },
                  error,
                })
              )
            )
          )
      )
    )
  );

  proxyUploadSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofGenericType(uploadSuccessFactory(GenericFile)),
      map(
        ({ info, criteria, pendingFile }) =>
          new CreateSuccess(
            info.modelType,
            pendingFile,
            criteria,
            pendingFile.correlationId
          )
      )
    )
  );

  proxyFileDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofGenericType(deleteFactory(PendingFile)),
      concatMap(({ info, file, criteria, correlationId }) =>
        this.store
          .select(
            selectPendingUploadByCorrelationIdFactory(
              resolveState(info.modelType)
            )(file.correlationId)
          )
          .pipe(
            take(1),
            map((pending) => ({
              pending,
              info,
              file,
              criteria,
              correlationId,
            }))
          )
      ),
      map(({ info, file, criteria, correlationId, pending }) =>
        pending
          ? removePendingFactory(info.modelType)({
              criteria,
              correlationId,
              pendingFile: file,
            })
          : new Delete(info.modelType, file, criteria, correlationId)
      )
    )
  );

  proxyFileDeleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofGenericType(deleteFactory(GenericFile)),
      mergeMap(({ info, correlationId }) =>
        this.actions$.pipe(
          ofEntityType(info.modelType, EntityActionTypes.DeleteSuccess),
          filter((action) => action.correlationId === correlationId),
          map((action) =>
            deleteSuccessFactory(info.modelType)({
              file: (action as DeleteSuccess<any>).entity,
              criteria: (action as DeleteSuccess<any>).criteria,
              correlationId,
            })
          )
        )
      )
    )
  );

  proxyFileDeleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofGenericType(deleteFactory(GenericFile)),
      mergeMap(({ info, correlationId }) =>
        this.actions$.pipe(
          ofEntityType(info.modelType, EntityActionTypes.DeleteFailure),
          filter((action) => action.correlationId === correlationId),
          map((action) =>
            deleteFailureFactory(info.modelType)({
              file: (action as DeleteFailure<any>).entity,
              error: (action as DeleteFailure<any>).error,
              correlationId,
            })
          )
        )
      )
    )
  );
}
