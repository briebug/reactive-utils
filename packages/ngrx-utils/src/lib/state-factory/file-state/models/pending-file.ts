import { GenericFile } from './generic-file';

export class PendingFile extends GenericFile {
  fileBlob?: File | Blob;
  base64Url?: string;
  failed?: boolean;
  processing?: boolean;
  progress?: {
    loaded?: number;
    total?: number;
  };
  correlationId?: string;
}
