import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { merge, Observable, of } from 'rxjs';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { FastifyReply } from 'fastify';

@Injectable()
export class HttpInterceptor implements NestInterceptor {
  /**
   * Class constructor
   * @param _logger
   */
  constructor(private readonly _logger: Logger) {}

  /**
   * Intercepts all HTTP requests and responses
   *
   * @param context
   * @param next
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cls = context.getClass();
    const handler = context.getHandler();
    const response: FastifyReply = context
      .switchToHttp()
      .getResponse<FastifyReply>();
    const logCtx = `${cls.name}.${handler.name}`;

    return next.handle().pipe(
      map((_) => of(_)),
      mergeMap((obs: Observable<any>) =>
        merge(
          obs.pipe(
            filter((_) => !!_),
            map((_) => _),
          ),
          obs.pipe(
            filter((_) => !_),
            tap(() => response.status(204)),
            map((_) => _),
          ),
        ),
      ),
      tap({
        next: () => this._logger.log('success', logCtx),
        error: (_) => this._logger.error(_.message, JSON.stringify(_), logCtx),
      }),
    );
  }
}
