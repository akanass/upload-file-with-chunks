import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AssetsConfig, ServerConfig, ViewsConfig } from './types/config.type';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import * as Config from 'config';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import * as HtmlMinifier from 'html-minifier-terser';
import * as metadata from './metadata.json';

async function bootstrap(
  config: ServerConfig,
  views: ViewsConfig,
  assets: AssetsConfig,
) {
  // create NestJS application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(Object.assign({}, config.options)),
  );

  // register all plugins
  app
    // set static assets
    .useStaticAssets(
      Object.assign({}, assets.options, {
        root: join(__dirname, assets.rootPath),
      }),
    )
    // set view engine
    .setViewEngine({
      engine: {
        handlebars: Handlebars,
      },
      templates: join(__dirname, views.templatesPath),
      layout: views.layout,
      includeViewExtension: views.includeViewExtension,
      options: Object.assign({}, views.engineOptions, {
        useHtmlMinifier: HtmlMinifier,
      }),
      defaultContext: Object.assign({}, metadata),
      production: process.env.NODE_ENV === 'production',
    });

  // launch server
  await app.listen(config.port, config.host);
  Logger.log(
    `Application served at ${config.protocol}://${config.host}:${config.port}`,
    'bootstrap',
  );
}

bootstrap(
  Config.get<ServerConfig>('server'),
  Config.get<ViewsConfig>('views'),
  Config.get<AssetsConfig>('assets'),
);
