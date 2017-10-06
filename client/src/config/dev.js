'use strict';

import baseConfig from './base';

let config = {
  appEnv: 'dev',
  authServer: 'http://localhost:3000',
  apiEndpoint: 'http://localhost:3000',
  dataBucket: 'http://localhost:8080/',
  s3Region: 'us-west-2',
  s3Bucket: 'shortcut-getting-started',
};

export default Object.freeze(Object.assign({}, baseConfig, config));
