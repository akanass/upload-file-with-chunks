/**
 * Get page's elements
 */
import { rxFileUpload } from './lib/rx-file-upload';
import { filter } from 'rxjs/operators';

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

/**
 * Variables used inside process
 */
const defaultFilesListContent = '<p>No file selected for the moment.</p>';
let files: File[];

/**
 * Add event listener on window.load to put all process in place
 */
window.addEventListener('load', () => {
  // reset all elements
  resetElements();

  // set select files button click process
  selectFilesButtonProcess();

  // set input file click process
  inputFileProcess();
});

/**
 * Process to reset all elements used in upload process
 */
const resetElements = () => {
  // clean file list
  files = [];
  // delete preview list
  previewContainer.innerHTML = defaultFilesListContent;
  // disable upload button
  uploadFilesButton.disabled = true;
};

/**
 * Process when we click on select files button
 */
const selectFilesButtonProcess = () => {
  selectFilesButton.addEventListener('click', () => {
    // click on hidden input file
    selectFilesInput.click();
    // reset all elements
    resetElements();
  });
};

/**
 * Process when click on input type file
 */
const inputFileProcess = () => {
  // build files array and display file list in preview container
  selectFilesInput.addEventListener('change', (e: Event) => {
    // get file list
    const fileList: FileList = e.target['files'];

    // build files array
    files = Array.from(
      { length: fileList.length },
      (_, idx: number) => idx++,
    ).map((i: number) => fileList.item(i));

    console.log(
      files[0].name,
      formatFileSizeDisplay(files[0].size),
      files[0].type,
    );

    rxFileUpload({
      url: '/api/upload',
    })
      .uploadFile(files[0])
      .pipe(filter((_) => _.type === 'upload_progress'))
      .subscribe((_) => console.log(_));
  });
  // clean previous selected files
  selectFilesInput.addEventListener(
    'click',
    (e: Event) => (e.target['value'] = null),
  );
};

/**
 * Helper to format file size in readable string
 */
const formatFileSizeDisplay = (size: number) => {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size >= 1024 && size < 1048576) {
    return `${(size / 1024).toFixed(1)} Kb`;
  } else if (size >= 1048576 && size < 1073741824) {
    return `${(size / 1048576).toFixed(1)} Mb`;
  } else if (size >= 1073741824) {
    return `${(size / 1073741824).toFixed(1)} Gb`;
  }
};
