import { beforeAll, beforeEach, afterAll } from 'vitest';
import { connect, clearAll, disconnect } from './testDb';

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearAll();
});

afterAll(async () => {
  await disconnect();
});
