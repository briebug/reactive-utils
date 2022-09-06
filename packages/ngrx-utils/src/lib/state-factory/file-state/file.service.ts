import { HttpClient, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEntityInfo } from '@briebug/ngrx-auto-entity';
import { iif, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { buildParentPaths, EntityCriteria } from '../../domains/entity.service.utils';
import { PendingFile } from '../../domains/models/pending-file';
import { ConfigService } from '../services/config.service';

@Injectable()
export class FileService {
  constructor(private http: HttpClient, private readonly config: ConfigService) {}

  uploadFile(
    entityInfo: IEntityInfo,
    pendingFile: PendingFile,
    criteria?: EntityCriteria,
    skipAPISuccessCall = false
  ): Observable<PendingFile | HttpProgressEvent> {
    const parentsPaths = buildParentPaths(criteria);
    return this.http
      .post<PendingFile>(`${this.config.host}${parentsPaths}/uploads`, {
        filename: pendingFile.filename,
        contentType: pendingFile.contentType,
      })
      .pipe(
        switchMap(file =>
          this.http
            .put(file.uploadUrl, pendingFile.fileBlob, { observe: 'events', reportProgress: true })
            .pipe(
              switchMap(event =>
                iif(
                  () => event.type === HttpEventType.Response,
                  skipAPISuccessCall
                    ? of({ ...pendingFile, isUploaded: true })
                    : this.http
                        .put(`${this.config.host}${parentsPaths}}/files/${file.id}`, { ...file, isUploaded: true })
                        .pipe(map(() => ({ ...file, isUploaded: true }))),
                  of(event).pipe(filter<HttpProgressEvent>(e => e.type === HttpEventType.UploadProgress))
                )
              )
            )
        )
      );
  }
}
