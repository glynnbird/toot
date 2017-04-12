#!/usr/bin/env node

var app = require('../');
var config = app.config();
var pkg = require('../package.json');
var title = pkg.name + ' - ' + pkg.description;

// help and usage message
var usage = function() {
  console.log(title);
  console.log('Usage: toot "message"');
  console.log('   or: echo "message" | toot');
  process.exit();
};

// version message
var version = function() {
  console.log(pkg.version);
  process.exit();
};

// if we have no config
if (!config) {

  // go into setup mode
  app.interactive();

} else {

  // if we have something piped to stdin
  if (!process.stdin.isTTY) {
    var toot = '';
    process.stdin.setEncoding('utf8');

    // read each chunk from stdin
    process.stdin.on('readable', function() {
      var chunk = process.stdin.read();
      if (chunk !== null) {
        toot += chunk;
      }
    });

    // when it ends
    process.stdin.on('end', function() {
      app.toot(config, toot).then(function() {
        process.exit(0);
      });
    });

  } else  if (process.argv.length < 3) {
    usage();
  } else  if (process.argv[2] === '--help') {
    usage()
  } else if (process.argv[2] === '--version') {
    version();
  } else {
    // send the toot from the command-line argument
    app.toot(config, process.argv[2]).then(function() {
      process.exit(0);
    });
  }
 
}
