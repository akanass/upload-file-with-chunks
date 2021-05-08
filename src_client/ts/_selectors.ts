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
const useChunkInput: HTMLInputElement = document.querySelector('#use-chunks');
const addChecksumInput: HTMLInputElement = document.querySelector(
  '#add-checksum',
);
const chunkSizeContainer: HTMLDivElement = document.querySelector(
  '#chunk-size-selector',
);
const chunkSizeSelector: MDCSlider = new MDCSlider(chunkSizeContainer);

export {
  selectFilesInput,
  selectFilesButton,
  uploadFilesButton,
  previewContainer,
  fileEndpointInput,
  useChunkInput,
  addChecksumInput,
  chunkSizeSelector,
  chunkSizeContainer,
};
