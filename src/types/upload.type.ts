export type RxFileUploadFileData = {
  name: string;
  size: number;
  lastModified: number;
  type: string;
  sha256Checksum?: string;
};

export type RxFileUploadChunkData = Omit<
  RxFileUploadFileData,
  'sha256Checksum'
> & {
  sequence: number;
  totalChunks: number;
  startByte: number;
  endByte: number;
};
