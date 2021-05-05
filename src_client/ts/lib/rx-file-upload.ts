import { ajax, AjaxConfig, AjaxResponse } from 'rxjs/ajax';
import { from, merge, Observable, of, Subject } from 'rxjs';
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
> & { chunkSize?: number; maxConnections?: number };

/**
 * Chunk size type definition
 */
export type RxFileUploadChunkSize = {
  readonly startByte: number;
  readonly endByte: number;
};

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
  readonly headers: Record<string, string>;
  readonly response: T;
  readonly fileIndex?: number;
};

/**
 * List of AjaxConfig allowed properties to be sure to have the right ones when using JS and not TS
 * because JS doesn't use typings so you can pass what you want inside and if one property isn't allowed
 * we will throw an error
 */
const allowedConfigProperties: string[] = [
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

/**
 * Variable to store 1024 bytes / 1 Kb
 */
const oneKb = 1024;

/**
 * Default chunk size value to 1 048 576 bytes / 1024 Kb / 1 Mb
 */
const defaultChunkSize: number = oneKb * oneKb;

/**
 * Default max connections
 */
const defaultMaxConnections = 3;

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
  // private property to store xhr configuration
  private _config: AjaxConfig;
  // private property to store ajax function
  private readonly _ajax: <T>(
    config: AjaxConfig,
  ) => Observable<AjaxResponse<T>>;
  // private property to store chunk size
  private readonly _chunkSize: number;
  // private property to store simulate max connections
  private readonly _maxConnections: number;
  // private property to store progress Subject
  private readonly _progress$: Subject<RxFileUploadProgressData>;

  /**
   * Class constructor
   *
   * @param {RxFileUploadConfig} config object to configure the chunks upload process
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
      this._chunkSize = defaultChunkSize;
    }

    // set max connections property
    if (!!config.maxConnections) {
      // check max connections before storing it
      this._checkMaxConnections(config.maxConnections);
      // set max connections
      this._maxConnections = config.maxConnections;
      // delete max connections in config
      delete config.maxConnections;
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
   * Function to upload one file to the server with optional additional data
   *
   * @param {File} file the uploaded file
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  public uploadFile = <T>(
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<RxFileUploadResponse<T>> =>
    this._fileBodyData(file, additionalFormData).pipe(
      mergeMap((f: FormData) =>
        this._ajax<T>({ ...this._config, body: f }).pipe(
          mergeMap((ajaxResponse: AjaxResponse<T>) =>
            merge(
              of(ajaxResponse.type).pipe(
                filter((type) => type === 'upload_progress'),
                tap(() =>
                  this._progress$.next({
                    progress: Math.round(
                      (ajaxResponse.loaded * 100) / ajaxResponse.total,
                    ),
                  }),
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
            headers: ajaxResponse.responseHeaders,
          })),
        ),
      ),
    );

  /**
   * Helper to build formData body for one file upload
   *
   * @param {File} file the uploaded file
   * @param {RxFileUploadAdditionalFormData} additionalFormData sent to the server
   */
  private _fileBodyData = (
    file: File,
    additionalFormData?: RxFileUploadAdditionalFormData,
  ): Observable<FormData> =>
    this._calculateCheckSum(file).pipe(
      map((checksum: string) => ({
        fileData: this._serialize({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type,
          sha256Checksum: checksum,
        }),
        file,
      })),
      map((data: { fileData: string; file: File }) =>
        typeof additionalFormData !== 'undefined' &&
        typeof additionalFormData.fieldName === 'string' &&
        ['string', 'object'].includes(typeof additionalFormData.data)
          ? {
              formData: new FormData(),
              data: {
                ...data,
                [additionalFormData.fieldName]: this._serialize(
                  additionalFormData.data,
                ),
              },
            }
          : {
              formData: new FormData(),
              data,
            },
      ),
      map((_: { formData: FormData; data: any }) => {
        Object.keys(_.data).forEach((key: string) =>
          _.formData.append(key, _.data[key]),
        );
        return _.formData;
      }),
    );

  /**
   * Function to check if chunk size is a multiple of 1024 bytes (1 Kb)
   *
   * @param {number} chunkSize the size of one chunk
   */
  private _checkChunkSize = (chunkSize: number): void => {
    if (typeof chunkSize !== 'number' || chunkSize % oneKb !== 0) {
      throw new Error(
        'The size of a chunk must be a multiple of 1024 bytes !!!',
      );
    }
  };

  /**
   * Function to check if max connections is good value
   *
   * @param {number} maxConnections the maximum simultaneous connections
   */
  private _checkMaxConnections = (maxConnections: number): void => {
    if (
      typeof maxConnections !== 'number' ||
      maxConnections < defaultMaxConnections
    ) {
      throw new Error(
        `The number of maximum simultaneous connections must be a positive integer greater than or equal to ${defaultMaxConnections} !!!`,
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
    config: Omit<RxFileUploadConfig, 'chunkSize' | 'maxConnections'>,
  ): void => {
    // check if config's properties are allowed -> JS verification when not using typings
    Object.keys(config).forEach((_) => {
      if (!allowedConfigProperties.includes(_))
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
