import { ajax, AjaxConfig, AjaxResponse } from 'rxjs/ajax';
import { from, merge, Observable, of, Subject, throwError } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  tap,
  toArray,
} from 'rxjs/operators';
import { SHA256 } from 'crypto-es/lib/sha256';
import { WordArray } from 'crypto-es/lib/core';

/**
 * RxFileUploadConfig type declaration
 * It's a copy of AjaxConfig without few fields
 */
export type RxFileUploadConfig = Omit<
  AjaxConfig,
  | 'body'
  | 'async'
  | 'method'
  | 'createXHR'
  | 'progressSubscriber'
  | 'includeUploadProgress'
  | 'includeDownloadProgress'
> & { chunkSize?: number; addChecksum?: boolean; useChunks?: boolean };

/**
 * Additional formData type definition
 */
export type RxFileUploadAdditionalFormData = {
  readonly fieldName: string;
  readonly data: any;
};

/**
 * Progress Observable data type definition
 */
export type RxFileUploadProgressData = {
  readonly progress: number;
  readonly fileIndex?: number;
};

/**
 * Upload Observable response type definition
 */
export type RxFileUploadResponse<T> = {
  readonly status: number;
  readonly responseHeaders: Record<string, string>;
  readonly response: T;
  readonly fileIndex?: number;
};

/**
 * Chunk size type definition
 *
 * @internal
 */
type RxFileUploadChunkSize = {
  readonly startByte: number;
  readonly endByte: number;
};

/**
 * Chunk sequence type definition
 */
type RxFileUploadChunkSequenceData = {
  readonly sequence: number;
  readonly totalChunks: number;
};

/**
 * Chunk data type definition
 *
 * @internal
 */
type RxFileUploadChunkData = {
  readonly file: File;
} & RxFileUploadChunkSize &
  RxFileUploadChunkSequenceData;

/**
 * Body form data type definition
 *
 * @internal
 */
type RxFileUploadBodyData = {
  readonly formData: FormData;
  readonly data: any;
};

/**
 * Helper to check if we are in the browser and all required elements are available
 */
export const supportRxFileUpload = (): boolean =>
  typeof window !== 'undefined' &&
  typeof XMLHttpRequest === 'function' &&
  typeof FormData === 'function';

/**
 * RxFileUpload class definition
 *
 * This class will do the process to upload file with chunks
 */
export class RxFileUpload {
  /**
   * List of AjaxConfig allowed properties to be sure to have the right ones when using JS and not TS
   * because JS doesn't use typings so you can pass what you want inside and if one property isn't allowed
   * we will throw an error
   */
  private _allowedConfigProperties: string[] = [
    'url',
    'headers',
    'timeout',
    'user',
    'password',
    'crossDomain',
    'withCredentials',
    'xsrfCookieName',
    'xsrfHeaderName',
    'responseType',
    'queryParams',
  ];
  // private property to store 1024 bytes / 1 Kb
  private _oneKb = 1024;
  // private property to store xhr configuration
  private _config: AjaxConfig;
  // private property to store ajax function
  private readonly _ajax: <T>(
    config: AjaxConfig,
  ) => Observable<AjaxResponse<T>>;
  // private property to store chunk size
  private readonly _chunkSize: number;
  // private property to store flag to know if checksum is disable or not
  private readonly _addChecksum: boolean;
  // private property to store flag to know if chunks split is disable or not
  private readonly _useChunks: boolean;
  // private property to store progress Subject
  private readonly _progress$: Subject<RxFileUploadProgressData>;

  /**
   * Class constructor
   *
   * @param {RxFileUploadConfig} config object to configure the upload process
   */
  constructor(config: RxFileUploadConfig) {
    // check if functionality is available
    if (!supportRxFileUpload()) {
      throw new Error(
        'You must be in a compatible browser to use this library !!!',
      );
    }

    // set chunk size property
    if (!!config.chunkSize) {
      // check chunk size before storing it
      this._checkChunkSize(config.chunkSize);
      // set chunk size
      this._chunkSize = config.chunkSize;
      // delete chunk size in config
      delete config.chunkSize;
    } else {
      // set default chunk size to 1 Mb
      this._chunkSize = this._oneKb * this._oneKb;
    }

    // check if flag is set in the config
    if (typeof config.addChecksum !== 'undefined') {
      // set flag to know if checksum is disable or not
      if (typeof config.addChecksum === 'boolean')
        this._addChecksum = config.addChecksum;
      else this._addChecksum = false;
      // delete flag in config
      delete config.addChecksum;
    } else {
      // set default value to false
      this._addChecksum = false;
    }

    // check if flag is set in the config
    if (typeof config.useChunks !== 'undefined') {
      // set flag to know if checksum is disable or not
      if (typeof config.useChunks === 'boolean')
        this._useChunks = config.useChunks;
      else this._useChunks = false;
      // delete flag in config
      delete config.useChunks;
    } else {
      // set default value to false
      this._useChunks = false;
    }

    // set ajax configuration property
    this._setAjaxConfig(config);

    // set ajax function property
    this._ajax = ajax;

    // set progress Subject
    this._progress$ = new Subject<RxFileUploadProgressData>();
  }

  /**
   * Getter to return progress Observable
   */
  public get progress$(): Observable<RxFileUploadProgressData> {
    return this._progress$.pipe(distinctUntilChanged());
  }

  /**
   * Function to upload one or multiple files to the server with optional additional data
   *
   * @param {File|File[]} oneFileOrMultipleFiles the file(s) to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  public upload = <T>(
    oneFileOrMultipleFiles: File | File[],
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<RxFileUploadResponse<T>> =>
    of([].concat(oneFileOrMultipleFiles)).pipe(
      mergeMap((files: File[]) =>
        merge(
          // no file to upload throw error
          of(files.length).pipe(
            filter((length: number) => length === 0),
            mergeMap(() =>
              throwError(
                () =>
                  new Error('You must provide at least one file to upload.'),
              ),
            ),
          ),
          // upload only one file
          of(files.length).pipe(
            filter((length: number) => length === 1),
            mergeMap(() => this._uploadFile<T>(files[0], additionalFormData)),
          ),
          // upload multiple files TODO
          of(files.length).pipe(
            filter((length: number) => length > 1),
            mergeMap(() =>
              throwError(
                () =>
                  new Error(
                    'Multiple files uploading is not supported at the moment.',
                  ),
              ),
            ),
          ),
        ),
      ),
    );

  /**
   * Function to upload one file, with or without chunk, to the server with optional additional data
   *
   * @param {File} file the file to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _uploadFile = <T>(
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<RxFileUploadResponse<T>> =>
    of(of(this._useChunks)).pipe(
      mergeMap((obs: Observable<boolean>) =>
        merge(
          obs.pipe(
            filter((useChunks: boolean) => !!useChunks),
            mergeMap(() =>
              this._sendFileWithChunks<T>(file, additionalFormData),
            ),
          ),
          obs.pipe(
            filter((useChunks: boolean) => !useChunks),
            mergeMap(() => this._sendFile<T>(file, additionalFormData)),
          ),
        ),
      ),
    );

  /**
   * Function to upload one file without chunk to the server with optional additional data
   *
   * @param {File} file the file to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _sendFile = <T>(
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<RxFileUploadResponse<T>> =>
    this._fileBodyData(file, additionalFormData).pipe(
      mergeMap((f: FormData) => this._makeAjaxCall<T>(f)),
    );

  /**
   * Function to upload one file with chunks to the server with optional additional data
   *
   * @param {File} file the file to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _sendFileWithChunks = <T>(
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<RxFileUploadResponse<T>> => {
    // TODO implements chunks process
    return throwError(
      () => new Error('Uploading files with chunks is not yet supported.'),
    );
  };

  /**
   * Function to make the AJAX call to the server
   * @param {FormData} f the form data object to send to the server
   * @param {RxFileUploadChunkSequenceData} chunk data to calculate real progress if it's a chunk
   * @param {number} fileIndex the index of the file for a multiple upload
   */
  private _makeAjaxCall = <T>(
    f: FormData,
    chunk?: RxFileUploadChunkSequenceData,
    fileIndex?: number,
  ): Observable<RxFileUploadResponse<T>> =>
    this._ajax<T>({ ...this._config, body: f }).pipe(
      mergeMap((ajaxResponse: AjaxResponse<T>) =>
        merge(
          of(ajaxResponse.type).pipe(
            filter((type) => type === 'upload_progress'),
            map(() => ({
              progress: this._calculateProgress(
                Math.round((ajaxResponse.loaded * 100) / ajaxResponse.total),
                chunk,
              ),
            })),
            mergeMap((progress: RxFileUploadProgressData) =>
              merge(
                of(fileIndex).pipe(
                  filter((_: number) => typeof _ === 'number'),
                  map(() => ({ ...progress, fileIndex })),
                ),
                of(fileIndex).pipe(
                  filter((_: number) => typeof _ !== 'number'),
                  map(() => progress),
                ),
              ),
            ),
            tap((progress: RxFileUploadProgressData) =>
              this._progress$.next(progress),
            ),
            map(() => ajaxResponse),
          ),
          of(ajaxResponse.type).pipe(
            filter((type) => type === 'upload_load'),
            tap(() => this._progress$.complete()),
            map(() => ajaxResponse),
          ),
          of(ajaxResponse.type).pipe(
            filter((type) => type === 'download_load'),
            map(() => ajaxResponse),
          ),
        ),
      ),
      filter(
        (ajaxResponse: AjaxResponse<T>) =>
          ajaxResponse.type === 'download_load',
      ),
      map((ajaxResponse: AjaxResponse<T>) => ({
        status: ajaxResponse.status,
        response: ajaxResponse.response,
        responseHeaders: Object.keys(ajaxResponse.responseHeaders)
          .filter((key: string) => key !== '')
          .reduce(
            (acc, curr) => ({
              ...acc,
              [curr]: ajaxResponse.responseHeaders[curr],
            }),
            {},
          ),
      })),
      mergeMap((response: RxFileUploadResponse<T>) =>
        merge(
          of(fileIndex).pipe(
            filter((_: number) => typeof _ === 'number'),
            map(() => ({ ...response, fileIndex })),
          ),
          of(fileIndex).pipe(
            filter((_: number) => typeof _ !== 'number'),
            map(() => response),
          ),
        ),
      ),
    );

  /**
   * Helper to calculate current progress value
   *
   * @param {number} progress the current ajax response progress value
   * @param {RxFileUploadChunkSequenceData} chunk data to calculate real progress if it's a chunk
   */
  private _calculateProgress = (
    progress: number,
    chunk?: RxFileUploadChunkSequenceData,
  ): number =>
    typeof chunk === 'object'
      ? Math.round(
          progress / chunk.totalChunks +
            (chunk.sequence - 1) * (100 / chunk.totalChunks),
        )
      : progress;

  /**
   * Helper to build formData body for one file upload
   *
   * @param {File} file the file to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _fileBodyData = (
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<FormData> =>
    this._fileDataWithAdditionalData(file, additionalFormData).pipe(
      map((data: any) => ({
        formData: new FormData(),
        data: { ...data, file },
      })),
      map((_: RxFileUploadBodyData) => {
        Object.keys(_.data).forEach((key: string) =>
          _.formData.append(key, _.data[key]),
        );
        return _.formData;
      }),
    );

  /**
   * Helper to build fileData and additionalData values to insert inside FormData
   *
   * @param {File} file the file to upload to the server
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _fileDataWithAdditionalData = (
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<any> =>
    of(of(this._addChecksum)).pipe(
      mergeMap((obs: Observable<boolean>) =>
        merge(
          obs.pipe(
            filter((addChecksum: boolean) => !!addChecksum),
            mergeMap(() =>
              this._calculateCheckSum(file).pipe(
                map((checksum: string) => ({
                  fileData: this._serialize({
                    name: file.name,
                    size: file.size,
                    lastModified: file.lastModified,
                    type: file.type,
                    sha256Checksum: checksum,
                  }),
                })),
              ),
            ),
          ),
          obs.pipe(
            filter((addChecksum: boolean) => !addChecksum),
            map(() => ({
              fileData: this._serialize({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                type: file.type,
              }),
            })),
          ),
        ),
      ),
      map((data: { fileData: string }) =>
        typeof additionalFormData !== 'undefined' &&
        typeof additionalFormData.fieldName === 'string' &&
        ['string', 'object'].includes(typeof additionalFormData.data)
          ? {
              ...data,
              [additionalFormData.fieldName]: this._serialize(
                additionalFormData.data,
              ),
            }
          : data,
      ),
    );

  /**
   * Function to check if chunk size is a multiple of 1024 bytes (1 Kb)
   *
   * @param {number} chunkSize the size of one chunk
   */
  private _checkChunkSize = (chunkSize: number): void => {
    if (typeof chunkSize !== 'number' || chunkSize % this._oneKb !== 0) {
      throw new Error(
        'The size of a chunk must be a multiple of 1024 bytes !!!',
      );
    }
  };

  /**
   * Helper to check the validity of the config object before setting it in instance property
   *
   * @param {RxFileUploadConfig} config object to configure the xhr request
   *
   * @private
   */
  private _setAjaxConfig = (
    config: Omit<RxFileUploadConfig, 'chunkSize' | 'addChecksum' | 'useChunks'>,
  ): void => {
    // check if config's properties are allowed -> JS verification when not using typings
    Object.keys(config).forEach((_) => {
      if (!this._allowedConfigProperties.includes(_))
        throw new Error(
          `"${_}" isn't a valid property of "RxFileUploadConfig"`,
        );
    });

    // set configuration in class property after removing "content-type" header if exists
    // because the "body" will be a "FormData" so
    // a "content-type" of "multipart/form-data; boundary=----WebKitFormBoundary...." will be set automatically
    // and, after adding "method" and "includeUploadProgress" properties.
    this._config = {
      ...(!!config.headers
        ? {
            ...config,
            // remove content-type header if exists
            headers: Object.keys(config.headers)
              .filter((_) => _.toLowerCase() !== 'content-type')
              .reduce(
                (acc, curr) => ({ ...acc, [curr]: config.headers[curr] }),
                {},
              ),
          }
        : { ...config }),
      method: 'POST',
      includeUploadProgress: true,
    };
  };

  /**
   * Helper to calculate each chunk size
   *
   * @param {number} fileSize the size of the file to split on chunks
   */
  private _calculateChunkSizes = (
    fileSize: number,
  ): Observable<RxFileUploadChunkSize[]> =>
    from(
      Array.from(
        { length: Math.max(Math.ceil(fileSize / this._chunkSize), 1) },
        (_, offset: number) => offset++,
      ),
    ).pipe(
      map((offset: number) => ({
        startByte: offset * this._chunkSize,
        endByte: Math.min(fileSize, (offset + 1) * this._chunkSize),
      })),
      toArray(),
    );

  /**
   * Helper to calculate file checksum and return it as sha256 string
   *
   * @param {File} file the file to calculate the checksum
   */
  private _calculateCheckSum = (file: File): Observable<string> =>
    from(file.arrayBuffer()).pipe(
      map((arrayBuffer: ArrayBuffer) =>
        SHA256(WordArray.create(new Uint8Array(arrayBuffer))).toString(),
      ),
    );

  /**
   * Helper to serialize additional formData value
   *
   * @param {any} data the value to serialize string or object
   */
  private _serialize = (data: any): string =>
    typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Create a function to instantiate RxFileUpload
 *
 * @param {RxFileUploadConfig} config
 */
const rxFileUpload = (config: RxFileUploadConfig) => new RxFileUpload(config);

// export instance helper
export { rxFileUpload };
