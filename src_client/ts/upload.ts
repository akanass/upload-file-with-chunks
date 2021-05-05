import { Subscription } from 'rxjs';
import { defaultFilesListContent, fileUploadDetailTpl } from './_templates';
import {
  addChecksumInput,
  fileEndpointInput,
  previewContainer,
  selectFilesButton,
  selectFilesInput,
  uploadFilesButton,
} from './_selectors';
import {
  RxFileUploadProgressData,
  RxFileUploadResponse,
} from './lib/rx-file-upload';

/**
 * Variables used inside process
 */
let files: File[];
let fileDetailSelectors: any[];

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
const resetElements = (): void => {
  // clean file list
  files = [];
  fileDetailSelectors = [];
  // delete preview list
  previewContainer.innerHTML = defaultFilesListContent;
  // disable upload button
  uploadFilesButton.disabled = true;
};

/**
 * Process when we click on select files button
 */
const selectFilesButtonProcess = (): void => {
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
const inputFileProcess = (): void => {
  // build files array and display file list in preview container
  selectFilesInput.addEventListener('change', (e: Event) => {
    // get file list
    const fileList: FileList = e.target['files'];

    // build files array
    files = Array.from(
      { length: fileList.length },
      (_, idx: number) => idx++,
    ).map((i: number) => fileList.item(i));

    // update preview container
    buildFileListHtml();

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
const uploadFilesButtonProcess = (): void => {
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
      const manager = rxFileUpload({
        url: fileEndpointInput.value,
        addCheckSum: addChecksumInput.checked,
      });

      // listen on progress to update UI
      progressSubscription = manager.progress$.subscribe(
        (_: RxFileUploadProgressData) => updateProgressUI(_),
      );

      // upload file
      uploadSubscription = manager.uploadFile<any>(files[0]).subscribe({
        next: (_: RxFileUploadResponse<any>) => {
          // delete previous subscription to memory free
          uploadSubscription.unsubscribe();
          progressSubscription.unsubscribe();

          // update file path UI if it exists inside the response
          updateFilePathUI(_);

          // enable button with timeout to avoid flickering
          setTimeout(() => (selectFilesButton.disabled = false), 500);
        },
        error: (e) => console.error(e.message),
      });
    });
  });
};

/**
 * Function to build file list html
 */
const buildFileListHtml = (): void => {
  // check if we have files in the list
  if (files.length === 0) {
    // set default preview list
    previewContainer.innerHTML = defaultFilesListContent;
    fileDetailSelectors = [];
  } else {
    //set detail list
    previewContainer.innerHTML = files
      .map((file: File, index: number) => {
        return fileUploadDetailTpl
          .replace('{{filename}}', file.name)
          .replace('{{filesize}}', formatFileSizeDisplay(file.size))
          .replace(/{{fileIndex}}/gm, `${index}`);
      })
      .join('');
    // build selectors list
    files.forEach((_, index) => {
      fileDetailSelectors.push({
        progressValue: document.querySelector(`#progress-value_${index}`),
        progressValueText: document.querySelector(
          `#progress-value-text_${index}`,
        ),
        fileDetailPath: document.querySelector(
          `#file-upload-detail-path_${index}`,
        ),
        filePath: document.querySelector(`#file-upload-path_${index}`),
      });
    });
  }
};

/**
 * Function to update UI with progress data
 *
 * @param {RxFileUploadProgressData} data data to update UI
 */
const updateProgressUI = (data: RxFileUploadProgressData): void => {
  // get all elements to update
  const selectors =
    fileDetailSelectors[
      typeof data.fileIndex === 'number' ? data.fileIndex : 0
    ];
  // update content
  selectors.progressValue.classList.add('progress-value-content');
  selectors.progressValue.style.width = selectors.progressValueText.innerText = `${data.progress}%`;
};

/**
 * Function to update UI with uploaded data
 *
 * @param {RxFileUploadResponse<any>} data response from the API may contain filePath and fileIndex if coming from our API
 */
const updateFilePathUI = (data: RxFileUploadResponse<any>): void => {
  // check if the response comes from our API
  if (typeof data.response.filePath === 'string') {
    // get all elements to update
    const selectors =
      fileDetailSelectors[
        typeof data.fileIndex === 'number' ? data.fileIndex : 0
      ];
    // update content
    selectors.filePath.innerText = data.response.filePath;
    selectors.fileDetailPath.classList.remove('display-none');
  }
};

/**
 * Helper to format file size in readable string
 */
const formatFileSizeDisplay = (size: number): string => {
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
