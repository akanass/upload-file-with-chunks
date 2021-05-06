import { Injectable } from '@nestjs/common';
import { from, Observable, of } from 'rxjs';
import { filter, mergeMap, reduce } from 'rxjs/operators';

import { pipeline } from 'stream/promises';
import { join } from 'path';
import { tmpdir } from 'os';

import { FileDiskStorageWithChunks } from '../utils/file-disk-storage-with-chunks';
import { deserialize } from '../utils/functions';

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
        from(
          pipeline(
            data.file,
            new FileDiskStorageWithChunks({
              fields: data.fields,
              filename: data.filename,
            }),
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
                  filePath: join(tmpdir(), data.filename),
                },
              ),
            ),
          ),
        ),
      ),
    );
}
