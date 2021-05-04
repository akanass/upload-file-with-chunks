import {
  RxFileUpload,
  rxFileUpload,
  RxFileUploadProgressData,
} from './lib/rx-file-upload';
import { Subscription } from 'rxjs';

/**
 * Get page's elements
 */
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
const fileWithChunksEndpointInput: HTMLInputElement = document.querySelector(
  '#api-file-with-chunks-endpoint',
);

/**
 * Variables used inside process
 */
const defaultFilesListContent = '<p>No file selected for the moment.</p>';
let files: File[];

let progressSubscription: Subscription;
let uploadSubscription: Subscription;

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

  // set upload file click process
  uploadFilesButtonProcess();
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
  selectFilesButton.addEventListener('click', (e: MouseEvent) => {
    // stop normal process
    e.preventDefault();
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

    // update preview container TODO

    // enable upload button
    uploadFilesButton.disabled = false;
  });
  // clean previous selected files
  selectFilesInput.addEventListener(
    'click',
    (e: Event) => (e.target['value'] = null),
  );
};

/**
 * Process when click on upload button
 */
const uploadFilesButtonProcess = () => {
  uploadFilesButton.addEventListener('click', (e: MouseEvent) => {
    // stop normal process
    e.preventDefault();

    // disable all buttons
    uploadFilesButton.disabled = true;
    selectFilesButton.disabled = true;

    // delete previous subscription to memory free
    if (!!uploadSubscription) {
      uploadSubscription.unsubscribe();
    }
    if (!!progressSubscription) {
      progressSubscription.unsubscribe();
    }

    // import upload library
    import('./lib/rx-file-upload').then(({ rxFileUpload }) => {
      // create new instance of RxFileUpload
      const manager: RxFileUpload = rxFileUpload({
        url: fileEndpointInput.value,
      });

      // listen on progress to update UI TODO
      progressSubscription = manager.progress$.subscribe(
        (_: RxFileUploadProgressData) => console.log(_),
      );

      // upload file
      uploadSubscription = manager
        .uploadFile<any>(files[0], {
          fieldName: 'myAdditionalData',
          data: { test: 'one test value' },
        })
        .subscribe({
          next: (_) => {
            // update file path UI if exists inside the response TODO
            console.log(_);

            // delete previous subscription to memory free
            uploadSubscription.unsubscribe();
            progressSubscription.unsubscribe();

            // enable button with timeout to avoid flickering
            setTimeout(() => (selectFilesButton.disabled = false), 500);
          },
          error: (e) => console.error(e.metadata),
        });
    });
  });
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
