#!/usr/bin/env node

const chalk = require('chalk');
//const iconv = require('iconv-lite');
const fs = require('fs');
const { program } = require('commander'); // (normal include)

function extravar(value, previous) {
  return previous.concat([value]);
}

program
  .name('replacetoken')
  .description('tool to replace tokenin files')
  .version('0.1.0')
  .argument('<tokenfile>', 'token file (json)')
  .argument('<inputfile>', 'Input file to replace (json, yaml)')
  .option('-i, --inplace', 'In place processing', false)
  .option('-o, --outputfile <filename>', 'File name used for replacement (create in same directory as input file)')
  .option('--objects', 'During replace, remove the double quote if the target is an object', false)
  .option('-e, --extravar <value>', 'During replace, add additional variables/values to use', extravar, [])
  .parse()

function logGreen(log) { console.log(chalk.green(log)) }
function logRed(log) { console.log(chalk.red(log)) }
function logGray(log) { console.log(chalk.gray(log)) }

var myLibrary = require(__dirname + '/lib/index.js');
var commands = require(__dirname + '/lib/commands.js');

var context = {};
const mainOptions = program.opts();


run(program, mainOptions)

async function run(program, mainOptions) {

  //console.log('mainOptions\n===========')
  //console.log(mainOptions)
  //console.log('program\n===========')
  //console.log(program)
  //if (mainOptions.outputfile) console.log(`--outputfile: ${mainOptions.outputfile}`);
  //if (mainOptions.objects == true) console.log("Replace objects");
  //if (mainOptions.inplace == true) console.log("In place replacement");


  if (!mainOptions.outputfile && mainOptions.inplace == false) {
    logRed("Need at least one option -i or -o")
    process.exit([1])
  }

  if (mainOptions.outputfile && mainOptions.inplace == true) {
    logRed("Need either option -i or -o")
    process.exit([1])
  }

  context = myLibrary.readInputFile(context, program.args[0])
  await commands.computeReplace(context, program.args[1], mainOptions, "")


}
