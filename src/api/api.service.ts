import { Injectable } from '@nestjs/common';
import { from, Observable, of } from 'rxjs';
import { defaultIfEmpty, filter, map, mergeMap, reduce } from 'rxjs/operators';

import { pipeline } from 'stream/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createWriteStream } from 'fs';

import { deserialize } from '../utils/functions';
import {
  RxFileUploadChunkData,
  RxFileUploadFileData,
} from '../types/upload.type';

@Injectable()
export class ApiService {
  /**
   * Function to save file on the disk then return data to the client
   *
   * @param req the request object containing the formData
   */
  uploadFile = (req: any): Observable<any> =>
    of(req).pipe(
      mergeMap((r: any) => from(r.file())),
      mergeMap((data: any) =>
        of(data.fields.fileData).pipe(
          map((fileData: any) => deserialize(fileData.value)),
          mergeMap((fileData: RxFileUploadFileData) =>
            of(data.fields.chunkData).pipe(
              filter((chunkData: any) => typeof chunkData === 'object'),
              map((chunkData: any) => deserialize(chunkData.value)),
              map((chunkData: RxFileUploadChunkData) => ({
                path: join(tmpdir(), fileData.name),
                options: {
                  flags: chunkData.sequence > 1 ? 'r+' : 'w',
                  encoding: 'binary',
                  start: chunkData.startByte,
                },
              })),
              defaultIfEmpty({
                path: join(tmpdir(), fileData.name),
                options: {
                  flags: 'w',
                  encoding: 'binary',
                },
              }),
              mergeMap((config: any) =>
                from(
                  pipeline(
                    data.file,
                    createWriteStream(config.path, config.options),
                  ),
                ).pipe(
                  mergeMap(() =>
                    from(Object.keys(data.fields)).pipe(
                      filter((key: string) => key !== 'file'),
                      reduce(
                        (acc: any, curr: any) => ({
                          ...acc,
                          [curr]: deserialize(data.fields[curr].value),
                        }),
                        {
                          filePath: config.path,
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
}
