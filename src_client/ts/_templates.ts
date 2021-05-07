/**
 * Default file list template
 */
const defaultFilesListContent = `<div class="preview mdc-typography--body2 mgt30">No file selected for the moment.</div>`;

/**
 * File list detail template
 */
const fileUploadDetailTpl = `
    <div class="preview mgt30">
        <div class="file-upload-detail">
            <div class="file-upload-detail-description direction-column">
                <div class="mdc-typography--body2">{{filename}}</div>
                <div class="mdc-typography--caption">Size: {{filesize}}</div>
            </div>
            <div class="content-center file-upload-detail-progress">
                <div class="progress-container">
                    <div id="progress-value_{{fileIndex}}" class="progress-value">
                        <span id="progress-value-text_{{fileIndex}}" class="progress-value-text">0%</span>
                    </div>
                </div>
            </div>
        </div>
        <div id="file-upload-detail-path_{{fileIndex}}" class="display-none txt-al mdc-typography--caption">File uploaded to: <span id="file-upload-path_{{fileIndex}}"></span></div>
    </div>
`;

export { defaultFilesListContent, fileUploadDetailTpl };
