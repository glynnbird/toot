import fs from 'node:fs'
import * as m from 'mastodonclient'

// load config file
export function config(configFilename) {
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

// generate config file interactively
export async function interactive(configFilename) {
  const config = await m.auth()
  await saveConfig(config, configFilename)
  console.log('Autentication complete!')
  console.log('You can now do:')
  console.log('   toot <message>')
  console.log('to post to Mastodon.')
  console.log('')
  return config
}

// send a status update
export async function toot(config, message, visibility, cw) {
  const mc = new m.MastodonClient(config)
  return await mc.post(message, visibility, cw)
}

