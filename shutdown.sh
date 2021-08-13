#!/bin/sh
BASE_PATH=$(pwd)

echo 'shutting down customer compose...'
cd $BASE_PATH/customerAPI
docker-compose down
docker-compose rm

echo 'shutting down authority compose...'
cd $BASE_PATH/authorityAPI
docker-compose down
docker-compose rm

echo 'shutting down manufacturer compose...'
cd $BASE_PATH/manufacturerAPI
docker-compose down
docker-compose rm

echo 'shutting down notary compose...'
cd $BASE_PATH/notaryAPI
docker-compose down
docker-compose rm

echo 'shutting down kafka server...'
cd $BASE_PATH
docker-compose down
docker-compose rm