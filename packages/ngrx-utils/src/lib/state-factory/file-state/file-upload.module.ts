import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { META_REDUCERS } from '@ngrx/store';
import { FileEffects } from './file.effects';
import { fileEntityMetaReducer } from './file.reducer';
import { FileService } from './file.service';

export function fileEntityMetaReducerFactory() {
  return fileEntityMetaReducer;
}


@NgModule({
  imports: [EffectsModule.forFeature([FileEffects])],
  providers: [FileService, { provide: META_REDUCERS, useFactory: fileEntityMetaReducerFactory, multi: true }],
})
export class FileUploadModule {}
