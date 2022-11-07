#!/usr/bin/env node

const app = require('../');
const os = require('os');
const path = require('path');
const pkg = require('../package.json');
const title = pkg.name + ' - ' + pkg.description;

// command-line args
var args = require('commander');
args
  .version(pkg.version)
  .option('-c, --config [path]', 'Path to config file. Defaults to ~/.mastodon.json')
  .option('--visibility [direct|private|unlisted|public]. Defaults to "public"')
  .parse(process.argv);

// public by default
if (!args.visibility) {
  args.visibility = 'public';
}

// if we have no config
var configPath = args.config || path.join(os.homedir(), '.mastodon.json');
var config = app.config(configPath);

// if the config is missing
if (args.config && !config) {
  console.error('Missing config file');
  process.exit(1);
}

const main = async () => {
  // if we have no config
  if (!config) {

    // go into setup mode
    await app.interactive(configPath);

  } else {

    // if we have something piped to stdin
    if (!process.stdin.isTTY) {
      var toot = '';
      process.stdin.setEncoding('utf8');

      // read each chunk from stdin
      process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        if (chunk !== null) {
          toot += chunk;
        }
      });

      // when it ends
      process.stdin.on('end', async function () {
        await app.toot(config, toot, args.visibility)
        process.exit(0);
      });

    } else if (args.args && args.args[0]) {

      // send the toot from the command-line argument
      await app.toot(config, args.args[0], args.visibility)
      process.exit(0);
    }

  }
}

main()
