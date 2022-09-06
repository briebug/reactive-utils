import { createSelector, MemoizedSelector } from '@ngrx/store';
import { EntityKey } from '../../domains/entity.service.utils';
import { GenericFile } from '../../domains/models/generic-file';
import { PendingFile } from '../../domains/models/pending-file';
import { FileState } from './file-state';

export const mapToPendingUploads = <T extends GenericFile>(state: FileState<T>) => (state.pendingUploads || []).map(pend => ({
  ...pend,
  processing: !pend.failed,
  progressPercent: pend.progress.loaded > 0 ? pend.progress.loaded / pend.progress.total : 0,
}));

export const selectPendingUploadsFactory = <T extends GenericFile>(getState: (state) => FileState<T>) =>
  createSelector(getState, mapToPendingUploads);

export const selectPendingUploadByCorrelationIdFactory = <T extends GenericFile>(getState: (state) => FileState<T>) => (
  correlationId: string
) =>
  createSelector(selectPendingUploadsFactory(getState), uploads =>
    uploads.find(upload => upload.correlationId === correlationId)
  );

export const selectPendingDeleteFactory = <T extends GenericFile>(getState: (state) => FileState<T>) =>
  createSelector(getState, state => state.pendingDelete || []);

export type ProcessingFile<T extends GenericFile> = (PendingFile | T) & {
  processing: boolean;
  progressPercent?: number;
};

export const selectPendingFilesFactory = <T extends GenericFile>(
  selectPendingUploads: MemoizedSelector<unknown, ProcessingFile<PendingFile>[]>,
  selectPendingDelete: MemoizedSelector<unknown, EntityKey[]>,
  selectAll: MemoizedSelector<FileState<T>, T[]>
) =>
  createSelector(selectPendingUploads, selectPendingDelete, selectAll, (uploads, deletes, files): ProcessingFile<
    T
  >[] => [
    ...files.map(file => ({
      ...file,
      processing: deletes.includes(file.id),
      progressPercent: 1,
    })),
    ...uploads,
  ]);
