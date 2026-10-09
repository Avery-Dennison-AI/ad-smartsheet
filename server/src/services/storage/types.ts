/**
 * Interface for pluggable file storage backends.
 */
export interface IStorageDriver {
  save(key: string, stream: NodeJS.ReadableStream, mimeType: string): Promise<void>;
  readStream(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
