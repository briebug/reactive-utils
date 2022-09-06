import { Entity, Key } from '@briebug/ngrx-auto-entity';

@Entity({ modelName: 'GenericFile', uriName: 'files' })
export class GenericFile {
  @Key id?: number;
  filename?: string;
  contentType?: string;
  url?: string;
  uploadUrl?: string;
}
