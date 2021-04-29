import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Handler to answer to all GET routes and display the associated page
   */
  @Get('*')
  async displayUploadPage(@Res() res) {
    res.view('upload');
  }
}
