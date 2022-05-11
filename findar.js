#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');
const iconv = require('iconv-lite');
const fs = require('fs');
const commandLineArgs = require('command-line-args')

function logGreen(log) { console.log(chalk.green(log)) }
function logRed(log) { console.log(chalk.yellow(log)) }
function logGray(log) { console.log(chalk.gray(log)) }

var myLibrary = require(__dirname + '/lib/index.js');
var commands = require(__dirname + '/lib/commands.js');

var context;
// console.log(context)

/* first - parse the main command */
const mainDefinitions = [
  { name: 'command', defaultOption: true, defaultValue: 'help' }
]
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true })
run(mainOptions)

async function run(mainOptions) {
  const argv = mainOptions._unknown || []

  // console.log('mainOptions\n===========')
  // console.log(mainOptions)
  // select the blob from options
  // logGray('select blob : ' + mainOptions.blob)
  // logGray('find  blob  : ' + config.blobs[mainOptions.blob])


  switch (mainOptions.command) {

    case 'c':
    case 'compute':
      const computeDefinitions = [
        { name: 'command', defaultOption: true, defaultValue: 'show' },
        { name: 'flat', type: Boolean, alias: 'f' },
        { name: 'block', alias: 'b' },
        { name: 'path', alias: 'p' },
        { name: 'short', type: Boolean, alias: 's' },
        { name: 'input', alias: 'i' },
        { name: 'newName', alias: 'n' },
        { name: 'var', multiple: true },
        { name: 'objects', type: Boolean, alias: 'k' }
      ]
      const computeOptions = commandLineArgs(computeDefinitions, { argv })
      if (argv.length <= 0) { console.log(chalk.gray("-- Implicit use of \"compute show\"")) }
      // console.log('\ncomputeOptions\n============')
      console.log(computeOptions)

      if (! computeOptions.path) {
        logRed('// missing "path" command argument')
        process.exit([1])
      }
      if (! computeOptions.input) {
        logRed('// missing "input" command argument')
        process.exit([1])
      }

      context = myLibrary.readInputFile(context, computeOptions)

      switch (computeOptions.command) {

        case 'replace':
          await commands.computeShow(context, computeOptions, false)
          await commands.computeReplace(context, computeOptions, config.config.replaceprefix)
          break;

        default:
          console.log('Subcommand "' + computeOptions.command + '" unknown')
          break;
      }

      break;

    case 'help':
      console.log(figlet.textSync('envdesc-cli', {
        font: 'Slant'
      }));

      commands.printHelp()
      break;

    default:
      console.log('Command "' + mainOptions.command + ' doesn\'t exists')
      break;
  }
}
