import { Controller, Get, Res } from '@nestjs/common';
import * as Config from 'config';
import { SelectFilesInputConfig } from './types/config.type';

@Controller()
export class AppController {
  /**
   * Handler to answer to all GET routes and display the associated page
   */
  @Get('*')
  async displayUploadPage(@Res() res) {
    // get file upload input configuration
    let selectFilesInputConfig: SelectFilesInputConfig;
    try {
      selectFilesInputConfig = Config.get<SelectFilesInputConfig>(
        'selectFilesInput',
      );
    } catch (_) {
      selectFilesInputConfig = {
        accept: '*/*',
        multiple: false,
      };
    }
    res.view('upload', {
      accept: Array.isArray(selectFilesInputConfig.accept)
        ? selectFilesInputConfig.accept.join(',')
        : '*/*',
      multiple:
        typeof selectFilesInputConfig.multiple === 'boolean'
          ? selectFilesInputConfig.multiple
          : false,
    });
  }
}
