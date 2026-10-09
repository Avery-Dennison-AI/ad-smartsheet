import { env } from '../../config/env';
import type { IStorageDriver } from './types';
import { LocalDiskDriver } from './localDiskDriver';

export type { IStorageDriver } from './types';

function createDriver(): IStorageDriver {
  switch (env.STORAGE_DRIVER) {
    case 'local':
    default:
      return new LocalDiskDriver();
  }
}

export const storageDriver: IStorageDriver = createDriver();
