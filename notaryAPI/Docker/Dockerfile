FROM node:current as notary-node-builder
ARG BUILD_ID
LABEL build=$BUILD_ID
LABEL container=builder
WORKDIR /app

COPY . .

RUN yarn install
RUN yarn run build:prod

FROM node:current
WORKDIR /app
RUN ls -la
COPY --from=notary-node-builder /app/package.json /app/package.json
COPY --from=notary-node-builder /app/yarn.lock /app/yarn.lock 
COPY --from=notary-node-builder /app/.env.production /app/.env.production
COPY --from=notary-node-builder /app/ormconfig.production.json /app/ormconfig.json
RUN yarn install --production
COPY --from=notary-node-builder /app/dist /app/

EXPOSE 27000

CMD ["node", "src/index.js"]