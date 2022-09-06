import { ofType } from '@ngrx/effects';
import { Action, ActionCreator, Creator } from '@ngrx/store';
import { filter } from 'rxjs/operators';

export const ofGenericType: typeof ofType = (
  ...allowedTypes: Array<
    string | (ActionCreator<string, Creator> & { genericType?: string })
  >
) =>
  filter((action: Action & { genericType?: string }) =>
    allowedTypes.some((type) =>
      typeof type === 'string'
        ? action.genericType === type
        : action.genericType === type.genericType
    )
  );
