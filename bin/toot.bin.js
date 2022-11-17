#!/usr/bin/env node

const app = require('../')
const os = require('os')
const path = require('path')

const args = require('yargs')
  .option('config', {
    describe: 'Path to config file',
    default: path.join(os.homedir(), '.mastodon.json')
  })
  .option('visibility', {
    alias: ['v'],
    choices: ['direct', 'private', 'unlisted', 'public'],
    describe: 'Visibility of toot',
    default: 'public'
  })
  .option('cw', {
    alias: ['c'],
    type: 'string',
    describe: 'Content warning to appear before "Read More" reveal',
    default: undefined
  })
  .demandCommand(!process.stdin.isTTY ? 0 : 1)
  .help('help')
  .epilogue('Usage: toot <options> "toot text"')
  .argv

const body = args._[0]

// if we have no config
const config = app.config(args.config)

// if the config is missing
if (args.config && !config) {
  console.error('Missing config file')
  process.exit(1)
}

const main = async () => {
  // if we have no config
  if (!config) {
    // go into setup mode
    await app.interactive(args.config)
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
        await app.toot(config, toot, args.visibility)
        process.exit(0)
      })
    } else if (args && body) {
      // send the toot from the command-line argument
      const r = await app.toot(config, body, args.visibility, args.cw)
      process.exit(0)
    }
  }
}

main()
