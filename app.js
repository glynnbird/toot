"use strict"

const os = require('os');
const path = require('path');
const fs = require('fs');
const configFilename = path.join(os.homedir(),'.mastodon.json');
const Mastodon = require('mastodon-api');
const colors = require('colors');

// load config file
const config = function() {
  try {
    var data = fs.readFileSync(configFilename);
  } catch(e) {
    return null;
  }
  if (!data) {
    return null;
  }
  return JSON.parse(data);
};

// save config to file
const saveConfig = function(config) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(configFilename, JSON.stringify(config), { mode: '0600' }, function(err, data) {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

// prompt for namd & domain
const getAppDetails = function() {
  var prompt = require('prompt');
  var schema = {
    properties: {
      name: {
        description: 'Enter a name for this app',
        type: 'string',
        default: 'toot-client-' + Math.floor(Math.random()*1000),
        required: true
      },
      domain: {
        description: 'Enter the domain name of your Mastodon instance e.g. mastodon.social',
        type: 'string',
        pattern: '^[a-z0-9_\.\-]+$',
        default: 'mastodon.social',
        required: true
      }
    }
  };
  return new Promise(function(resolve, reject) {
    prompt.start();
    prompt.get(schema, function(err, result) {
      if (err) {
        return reject(err);
      }
      resolve (result);
    });
  });
};

// prompt for pass code
const getPassCode = function() {
  var prompt = require('prompt');
  var schema = {
    properties: {
      code: {
        description: 'Enter the pass code from your browser',
        type: 'string',
        required: true
      }
    }
  };
  return new Promise(function(resolve, reject) {
    prompt.start();
    prompt.get(schema, function(err, result) {
      if (err) {
        return reject(err);
      }
      resolve (result.code);
    });
  });
}

// generate config file interactively
const interactive = function() {

  var config = {};
  var baseURL = null;
  console.log('Before you start using toot, you need to authenticate with your Mastodon server.'.bold.red);

  return getAppDetails().then(function(d) {
    config.domain = d.domain;
    config.name = d.name;
    config.baseURL = 'https://' + config.domain;
    return Mastodon.createOAuthApp(config.baseURL + '/api/v1/apps', config.name);
  }).then(function(data) {
    for (var i in data) {
      config[i] = data[i];
    }
    return Mastodon.getAuthorizationUrl(config.client_id, config.client_secret, config.baseURL)
  }).then(function(url) {
    console.log('\nPlease visit: '.blue);
    console.log('');
    console.log(url.bold.green);
    console.log('')
    console.log('in your browser and enter the code you were given back'.blue);
    console.log('');
    return getPassCode();
  }).then(function(code) {
    return Mastodon.getAccessToken(config.client_id, config.client_secret, code, config.baseURL)
  }).then(function(accessToken) {
    config.accessToken = accessToken;
    return saveConfig(config);
  }).then(function(data) {
    console.log('Autentication complete!'.bold.red);
    console.log('You can now do:');
    console.log('   toot <message>'.red);
    console.log('to post to Mastodon.');
    console.log('');
    return config;
  }).catch(console.error);
}

// send a status update
const toot = function(config, message) {
  const c = {
    access_token: config.accessToken,
    api_url: config.baseURL + '/api/v1/'
  };
  const M = new Mastodon(c);
  return M.post('statuses', { status: message});
};

module.exports = {
  interactive: interactive,
  toot: toot,
  config: config
}