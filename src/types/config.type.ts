export type ServerConfig = {
  readonly protocol: string;
  readonly host: string;
  readonly port: number;
  readonly options: any;
};

export type AssetsConfig = {
  readonly rootPath: string;
  readonly options: any;
};

export type ViewsConfig = {
  readonly templatesPath: string;
  readonly layout: string;
  readonly includeViewExtension: boolean;
  readonly engineOptions: any;
};

export type UploadConfig = {
  readonly input: UploadInputConfig;
  readonly api: UploadApiEndpointConfig;
  readonly additionalFormData: UploadAdditionalFormData;
};

export type UploadApiEndpointConfig = {
  readonly fileEndpoint: string;
};

export type UploadInputConfig = {
  readonly accept: '*/*' | string[];
};

export type UploadAdditionalFormData = {
  readonly fieldName: string;
  readonly data: any;
};
