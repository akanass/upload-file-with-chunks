const selectFilesInput: HTMLInputElement = document.querySelector(
  '#input-file',
);
const selectFilesButton: HTMLButtonElement = document.querySelector(
  '#select-files',
);
const uploadFilesButton: HTMLButtonElement = document.querySelector(
  '#upload-files',
);
const previewContainer: HTMLDivElement = document.querySelector('#preview');
const fileEndpointInput: HTMLInputElement = document.querySelector(
  '#api-file-endpoint',
);
const useChunkInput: HTMLInputElement = document.querySelector('#use-chunks');
const addChecksumInput: HTMLInputElement = document.querySelector(
  '#add-checksum',
);

export {
  selectFilesInput,
  selectFilesButton,
  uploadFilesButton,
  previewContainer,
  fileEndpointInput,
  useChunkInput,
  addChecksumInput,
};
