#!/usr/bin/env node

var app = require('../');
var config = app.config();

// if we have no config
if (!config) {

  // go into setup mode
  app.interactive();

} else {

  // if insufficient number of arguments
  if (process.argv.length < 3) {
    console.error('Error: Usage: toot <message>');
    process.exit(1);
  }
  
  // toot
  app.toot(config, process.argv[2]).then(function() {
    process.exit(0);
  });
}
