import { Injectable } from '@nestjs/common';
import { from, merge, Observable, of } from 'rxjs';
import { filter, map, mergeMap, reduce } from 'rxjs/operators';

import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class ApiService {
  /**
   * Function to save file on the disk then return data to the client
   *
   * @param req the request object containing the formData
   * @param {boolean} isChunk flag to know if it's a chunk inside the file
   */
  uploadFile = (req: any, isChunk = false): Observable<any> =>
    of(req).pipe(
      mergeMap((r: any) => from(r.file())),
      mergeMap((data: any) =>
        this._storeFileOnDisk(data.file, data.filename, isChunk).pipe(
          mergeMap((filePath: string) =>
            from(Object.keys(data.fields)).pipe(
              filter((key: string) => key !== 'file'),
              reduce(
                (acc: any, curr: any) => ({
                  ...acc,
                  [curr]: this._deserialize(data.fields[curr].value),
                }),
                { filePath },
              ),
            ),
          ),
        ),
      ),
    );

  /**
   * Function to write the file on the disk in os.tmpdir() and return the path where the file has been written in
   *
   * @param {any} file the file data to write on the disk
   * @param {string} fileName the name of the file
   * @param {boolean} isChunk flag to know if it's a chunk inside the file
   */
  private _storeFileOnDisk = (
    file: any,
    fileName: string,
    isChunk = false,
  ): Observable<string> =>
    of(join(tmpdir(), fileName)).pipe(
      mergeMap((path: string) =>
        merge(
          of(isChunk).pipe(
            filter((_: boolean) => !!_),
            mergeMap(() =>
              from(
                pipeline(
                  /*createReadStream(path),*/ file,
                  createWriteStream(path),
                ),
              ).pipe(map(() => path)),
            ),
          ),
          of(isChunk).pipe(
            filter((_: boolean) => !_),
            mergeMap(() =>
              from(pipeline(file, createWriteStream(path))).pipe(
                map(() => path),
              ),
            ),
          ),
        ),
      ),
    );

  /**
   * Helper to deserialize additional data in formData
   */
  private _deserialize = (data: any): any => {
    try {
      return JSON.parse(data);
    } catch (err) {
      return data;
    }
  };
}
