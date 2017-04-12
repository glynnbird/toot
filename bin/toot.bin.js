#!/usr/bin/env node

var app = require('../');
var config = app.config();

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
    // if insufficient number of arguments
    console.error('Error: Usage: toot <message>');
    console.error('   or: echo "message" | toot');
    process.exit(1);
  }  else {
    // send the toot from the command-line argument
    app.toot(config, process.argv[2]).then(function() {
      process.exit(0);
    });
  }
  
}
