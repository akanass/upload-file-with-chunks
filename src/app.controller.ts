import { Controller, Get, Res } from '@nestjs/common';
import * as Config from 'config';
import {
  UploadInputConfig,
  UploadConfig,
  UploadApiEndpointConfig,
  UploadAdditionalFormData,
} from './types/config.type';
import { serialize } from './utils/functions';

@Controller()
export class AppController {
  /**
   * Handler to answer to all GET routes and display the associated page
   */
  @Get('*')
  async displayUploadPage(@Res() res) {
    // get file upload configuration
    let uploadConfig: UploadConfig;
    let uploadInputConfig: UploadInputConfig = {
      accept: '*/*',
    };
    let uploadApiEndpointConfig: UploadApiEndpointConfig = {
      fileEndpoint: '/api/upload',
    };
    let additionalFormData = '';
    let uploadAdditionalFormData: UploadAdditionalFormData;

    try {
      uploadConfig = Config.get<UploadConfig>('upload');
      uploadInputConfig = uploadConfig.input;
      uploadApiEndpointConfig = uploadConfig.api;
      uploadAdditionalFormData = uploadConfig.additionalFormData;
      if (
        typeof uploadAdditionalFormData?.fieldName !== 'undefined' &&
        typeof uploadAdditionalFormData?.data !== 'undefined'
      )
        additionalFormData = serialize(uploadAdditionalFormData);
    } catch (_) {}

    res.view('upload', {
      accept: Array.isArray(uploadInputConfig.accept)
        ? uploadInputConfig.accept.join(',')
        : '*/*',
      fileEndpoint: uploadApiEndpointConfig.fileEndpoint,
      additionalFormData,
    });
  }
}
