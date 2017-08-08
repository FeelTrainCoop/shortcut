#!/bin/bash

rm -rf ./dist/s3;
mkdir "./dist/s3";

# option 1: version number is a hash of app contents
unique=`cat ./dist/assets/app.js | md5`;
# option 2: version number tied to git commit
# unique=`git rev-parse HEAD`;

outputgz="./dist/s3/app_${unique}.js.gz";
outputjs="./dist/s3/app_${unique}.js"

rm ${outputgz};

cat ./dist/assets/app.js | gzip -9c >> ${outputgz};
cp ./dist/assets/app.js ${outputjs};

aws s3 cp ./dist/s3/ s3://shortcut-static --recursive --exclude "*" --include "*.gz" --content-encoding gzip --acl public-read --profile tal-shortcut;
aws s3 cp ./dist/s3/ s3://shortcut-static --recursive --exclude "*" --include "*.js" --acl public-read --profile tal-shortcut;

echo ''
echo 'Update this environment variable in tal-server .env + Elastic Beanstalk environments:'
echo APP_VERSION=${unique}
