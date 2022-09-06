import { IEntityState } from '@briebug/ngrx-auto-entity';
import { GenericFile } from './models/generic-file';
import { PendingFile } from './models/pending-file';

export interface FileState<T extends GenericFile> extends IEntityState<T> {
  pendingUploads: PendingFile[];
  pendingDelete: string[];
}

export const initialFileState = {
  pendingUploads: [],
  pendingDelete: [],
};
