#!/bin/sh
BASE_PATH=$(pwd)

echo 'removing old components'
sh shutdown.sh

echo 'start kafka server...'
docker-compose up -d

echo 'start build notary image...'
cd $BASE_PATH/notaryAPI
cp -r Docker/. .
docker build -t notary .
rm Dockerfile
rm .dockerignore
echo 'finish build notary image...'
docker-compose up -d
echo 'start notary server with postgres...'

echo 'start build manufacturer image...'
cd $BASE_PATH/manufacturerAPI
cp -r Docker/. .
docker build -t manufacturer .
rm Dockerfile
rm .dockerignore
echo 'finish build manufacturer image...'
docker-compose up -d
echo 'start manufacturer server with postgres...'

echo 'start build authority image...'
cd $BASE_PATH/authorityAPI
cp -r Docker/. .
docker build -t authority .
rm Dockerfile
rm .dockerignore
echo 'finish build authority image...'
docker-compose up -d
echo 'start authority server with postgres...'

echo 'start build customer image...'
cd $BASE_PATH/customerAPI
cp -r Docker/. .
docker build -t customer .
rm Dockerfile
rm .dockerignore
echo 'finish build customer image...'
docker-compose up -d
echo 'start customer server with postgres...'