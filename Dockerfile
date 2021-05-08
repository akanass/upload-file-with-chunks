# DEFINE BUILDER
FROM node:16-alpine AS BUILDER
MAINTAINER Akanass <akanass@icloud.com>

# UPDATE NPM
RUN npm install -g npm@latest

# WORKDIR
WORKDIR /usr/src/app

# COPY PACKAGE.JSON
COPY package.json .
COPY package-lock.json .

# INSTALL PACKAGES
RUN npm install --loglevel warn

# COPY CONTENT
COPY . .

# BUILD APP
RUN npm run build

# CLEAN PACKAGES
RUN npm prune --production

# DEFINE FINAL IMAGE
FROM node:16-alpine AS PROD
MAINTAINER Akanass <akanass@icloud.com>

# WORKDIR
WORKDIR /usr/src/app

# COPY APP DATA
COPY --from=BUILDER /usr/src/app/config ./config
COPY --from=BUILDER /usr/src/app/dist ./dist
COPY --from=BUILDER /usr/src/app/node_modules ./node_modules
COPY --from=BUILDER /usr/src/app/public ./public
COPY --from=BUILDER /usr/src/app/views ./views
