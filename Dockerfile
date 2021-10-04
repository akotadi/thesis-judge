# Install dependencies only when needed
FROM node:alpine AS deps
RUN apk add --no-cache libc6-compat
RUN apk update && \
    apk add git
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn

# Rebuild the source code only when needed
FROM node:alpine AS builder
RUN apk update && \
    apk add git
WORKDIR /usr/src/app
COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

# Production image, copy all the files and run next
FROM mcr.microsoft.com/playwright AS runner

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000

CMD ["yarn", "start"]