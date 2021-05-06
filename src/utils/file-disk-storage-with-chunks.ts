import { Transform, TransformCallback } from 'stream';
import { join } from 'path';
import { tmpdir } from 'os';
import { appendFile, unlink } from 'fs/promises';
import { Buffer } from 'buffer';
import { deserialize } from './functions';

/**
 * Class definition to store our file with chunks on the disk
 * This class is called inside a stream pipeline
 */
export class FileDiskStorageWithChunks extends Transform {
  // private property to store chunks
  private readonly _chunks: any[];
  // private property to store instance data
  private _data: { fields: any; filename: string };

  /**
   * Class constructor
   *
   * @param data mandatory data to process
   */
  constructor(data: { fields: any; filename: string }) {
    super();
    this._chunks = [];
    this._data = data;
  }

  /**
   * Function called for each chunk of the file
   */
  _transform = (
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void => {
    this._chunks.push(chunk);
    callback();
  };

  /**
   * Function called when all the chunks were read
   */
  _flush = (callback: TransformCallback): void => {
    // declare flag to know if we should delete the file before appending data
    let hasToUnlink = true;

    // check if are in a chunk call and if we have to append the content to the file
    if (typeof this._data.fields.chunkData === 'object') {
      // take chunk data inside the form data field
      const chunkData = deserialize(this._data.fields.chunkData.value);

      // stop deleting file because sequence > 1
      if (chunkData.sequence > 1) hasToUnlink = false;
    }

    // path to write/unlink file
    const path = join(tmpdir(), this._data.filename);

    // function to write file
    const writeable = () =>
      appendFile(path, Buffer.concat(this._chunks), { encoding: 'binary' });

    // check if we have to unlink file before writing it
    if (!hasToUnlink)
      writeable().then(
        () => callback(),
        (e) => callback(e),
      );
    else
      unlink(path).then(
        () =>
          writeable().then(
            () => callback(),
            (e) => callback(e),
          ),
        () =>
          writeable().then(
            () => callback(),
            (e) => callback(e),
          ),
      );
  };
}
