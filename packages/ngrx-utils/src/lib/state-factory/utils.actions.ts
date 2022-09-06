import { Action, ActionCreator, Creator } from '@ngrx/store';

export interface GenericAction extends Action {
  genericType?: string;
}

export type GenericActionCreator<
  T extends string = string,
  U extends string = string,
  C extends Creator = Creator
> = ActionCreator<T, C> & { genericType: U };
