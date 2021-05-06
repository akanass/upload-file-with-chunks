import { Controller, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiService } from './api.service';
import { HttpInterceptor } from './interceptors/http.interceptor';
import { Observable } from 'rxjs';

@Controller('api')
@UseInterceptors(HttpInterceptor)
export class ApiController {
  /**
   * Class constructor
   *
   * @param {ApiService} _apiService dependency injection of ApiService instance
   */
  constructor(private readonly _apiService: ApiService) {}

  /**
   * Function to handle the upload of a file and store it on the disk
   */
  @Post('upload')
  uploadFile(@Req() req): Observable<any> {
    return this._apiService.uploadFile(req);
  }
}
