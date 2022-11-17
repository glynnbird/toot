const fs = require('fs')
const Mastodon = require('mastodon-api')
const colors = require('colors')

// load config file
const config = function (configFilename) {
  let data
  try {
    data = fs.readFileSync(configFilename)
  } catch (e) {
    return null
  }
  if (!data) {
    return null
  }
  return JSON.parse(data)
}

// save config to file
const saveConfig = async function (config, configFilename) {
  return new Promise(function (resolve, reject) {
    fs.writeFileSync(configFilename, JSON.stringify(config), { mode: '0600' }, function (err, data) {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

// prompt for namd & domain
const getAppDetails = async function () {
  const prompt = require('prompt')
  const schema = {
    properties: {
      name: {
        description: 'Enter a name for this app',
        type: 'string',
        default: 'toot-client-' + Math.floor(Math.random() * 1000),
        required: true
      },
      domain: {
        description: 'Enter the domain name of your Mastodon instance e.g. mastodon.social',
        type: 'string',
        pattern: '^[a-z0-9_.:-]+$',
        default: 'mastodon.social',
        required: true
      }
    }
  }
  return new Promise(function (resolve, reject) {
    prompt.start()
    prompt.get(schema, function (err, result) {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })
}

// prompt for pass code
const getPassCode = async function () {
  const prompt = require('prompt')
  const schema = {
    properties: {
      code: {
        description: 'Enter the pass code from your browser',
        type: 'string',
        required: true
      }
    }
  }
  return new Promise(function (resolve, reject) {
    prompt.start()
    prompt.get(schema, function (err, result) {
      if (err) {
        return reject(err)
      }
      resolve(result.code)
    })
  })
}

// generate config file interactively
const interactive = async function (configFilename) {
  const config = {}
  console.log('Before you start using toot, you need to authenticate with your Mastodon server.'.bold.red)

  const d = await getAppDetails()
  config.domain = d.domain
  config.name = d.name
  config.baseURL = (/^(localhost|127\.0\.0\.1)/.test(config.domain) ? 'http' : 'https') + '://' + config.domain

  const data = await Mastodon.createOAuthApp(config.baseURL + '/api/v1/apps', config.name)
  for (const i in data) {
    config[i] = data[i]
  }
  const url = await Mastodon.getAuthorizationUrl(config.client_id, config.client_secret, config.baseURL)
  console.log('\nPlease visit: '.blue)
  console.log('')
  console.log(url.bold.green)
  console.log('')
  console.log('in your browser and enter the code you were given back'.blue)
  console.log('')
  const code = await getPassCode()
  const accessToken = await Mastodon.getAccessToken(config.client_id, config.client_secret, code, config.baseURL)
  config.accessToken = accessToken
  await saveConfig(config, configFilename)
  console.log('Autentication complete!'.bold.red)
  console.log('You can now do:')
  console.log('   toot <message>'.red)
  console.log('to post to Mastodon.')
  console.log('')
  return config
}

// send a status update
const toot = async function (config, message, visibility, cw) {
  const c = {
    access_token: config.accessToken,
    api_url: config.baseURL + '/api/v1/'
  }
  const M = new Mastodon(c)
  return M.post('statuses', { status: message, visibility, spoiler_text: cw })
}

module.exports = {
  interactive,
  toot,
  config
}
