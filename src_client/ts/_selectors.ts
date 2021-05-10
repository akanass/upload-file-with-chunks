import { MDCSlider } from '@material/slider';

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
const apiMethodInput: HTMLInputElement = document.querySelector('#api-method');
const apiCrossDomainInput: HTMLInputElement = document.querySelector(
  '#api-cross-domain',
);
const useChunkInput: HTMLInputElement = document.querySelector('#use-chunks');
const addChecksumInput: HTMLInputElement = document.querySelector(
  '#add-checksum',
);
const chunkSizeContainer: HTMLDivElement = document.querySelector(
  '#chunk-size-selector',
);
const chunkSizeSelector: MDCSlider = new MDCSlider(chunkSizeContainer);
const additionalFormDataInput: HTMLInputElement = document.querySelector(
  '#additional-form-data',
);

export {
  selectFilesInput,
  selectFilesButton,
  uploadFilesButton,
  previewContainer,
  fileEndpointInput,
  apiMethodInput,
  apiCrossDomainInput,
  useChunkInput,
  addChecksumInput,
  chunkSizeSelector,
  chunkSizeContainer,
  additionalFormDataInput,
};
