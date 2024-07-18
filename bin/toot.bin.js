#!/usr/bin/env node

const app = require('../')
const os = require('os')
const path = require('path')
const defaultConfigPath = path.join(os.homedir(), '.mastodon.json')
const syntax = 
`Syntax:
--config                            Path to config file  
--visibility/-v                     Visibility of toot direct/private/unlisted/public (default: public)
--cw/-c                             Content warning message (default: false)
`
const { parseArgs } = require('node:util')
const argv = process.argv.slice(2)
const options = {
  config: {
    type: 'string',
    default: defaultConfigPath
  },
  visibility: {
    type: 'string',
    short: 'v',
    default: 'default'
  },
  cw: {
    type: 'string'
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
}

// parse command-line options
const { values, positionals } = parseArgs({ argv, options, allowPositionals: true })

// help mode
if (values.help) {
  console.log(syntax)
  process.exit(0)
}

// extract message
const body = positionals[0]

// load config
const config = app.config(values.config)

const main = async () => {
  // if we have no config
  if (!config) {
    // go into setup mode
    console.log('No Mastodon config found. Going into setup mode.')
    await app.interactive(values.config)
  } else {
    // if we have something piped to stdin
    if (!process.stdin.isTTY) {
      let toot = ''
      process.stdin.setEncoding('utf8')

      // read each chunk from stdin
      process.stdin.on('readable', function () {
        const chunk = process.stdin.read()
        if (chunk !== null) {
          toot += chunk
        }
      })

      // when it ends
      process.stdin.on('end', async function () {
        await app.toot(config, toot, values.visibility)
        process.exit(0)
      })
    } else if (values && body) {
      // send the toot from the command-line argument
      await app.toot(config, body, values.visibility, values.cw)
      process.exit(0)
    } else {
      console.error('No message supplied - nothing to do')
      console.error('Usage: toot <message>')
      process.exit(1)
    }
  }
}

main()
