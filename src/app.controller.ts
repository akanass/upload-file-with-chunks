import { Controller, Get, Res } from '@nestjs/common';
import * as Config from 'config';
import {
  UploadInputConfig,
  UploadConfig,
  UploadApiEndpointConfig,
} from './types/config.type';

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

    try {
      uploadConfig = Config.get<UploadConfig>('upload');
      uploadInputConfig = uploadConfig.input;
      uploadApiEndpointConfig = uploadConfig.api;
    } catch (_) {}

    res.view('upload', {
      accept: Array.isArray(uploadInputConfig.accept)
        ? uploadInputConfig.accept.join(',')
        : '*/*',
      fileEndpoint: uploadApiEndpointConfig.fileEndpoint,
    });
  }
}
