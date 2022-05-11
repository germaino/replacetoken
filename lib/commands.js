const chalk = require('chalk');
const prettyjson = require('prettyjson');
const flat = require('flat');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const commandLineUsage = require('command-line-usage')

var myLibrary = require(__dirname + '/index.js');

function logGreen(log) { console.log(chalk.green(log)) }
function logYellow(log) { console.log(chalk.yellow(log)) }
function logGray(log) { console.log(chalk.gray(log)) }

async function computeShow(context, computeOptions, print) {
  if (computeOptions.block) {
    var computeBlockSplit = computeOptions.block.split('.')
    var singleBlockOutput = context.lastCall
    var elementConcat = ""

    for (let index = 0; index < computeBlockSplit.length; index++) {
      const element = computeBlockSplit[index];
      if (Object.keys(singleBlockOutput).includes(element)) {
        // log("Item " + elementConcat + "." + element + " was found in the result");
        singleBlockOutput = singleBlockOutput[element]
        elementConcat = elementConcat + "." + element
      } else {
        // log("Item " + elementConcat + "." + element + " was not found in the result, verify your environment blob");
        break
      }
    }
    context.lastCall = {
      Status: context.lastCall['Status']
    }
    context.lastCall[elementConcat.substring(1)] = singleBlockOutput
  }

  if (print) {
    if (computeOptions.short) {
      delete context.lastCall['Status']
    }

    if (computeOptions.flat) {
      console.log(prettyjson.render(flat(context.lastCall)))
    } else {
      console.log(prettyjson.render(context.lastCall))
    }
  }
}

async function computeReplace(context, computeOptions, replacePrefix) {
  var tokenPrefix = "#{"
  var tokenSuffix = "}#"
  var myRx = new RegExp(tokenPrefix + '((?:(?!' + tokenSuffix + '|' + tokenPrefix + ').)*)' + tokenSuffix, 'gm');
  var JsonRx = new RegExp('"' + tokenPrefix + '((?:(?!' + tokenSuffix + '|' + tokenPrefix + ').)*)' + tokenSuffix + '"', 'gm');

  var content = ""
  let runs = ["First", "Second", "Third"];
  try {
    content = iconv.decode(fs.readFileSync(computeOptions.path), 'utf-8');
  } catch (e) {
    console.log("Exception : " + e)
    return
  }

  context.replacePath = path.parse(computeOptions.path)
  if (computeOptions.newName) {
    context.replacePath.output = context.replacePath.dir + "/" + computeOptions.newName
  } else {
    var myprefix = replacePrefix.replace(myRx, (match, name) => {
      let value = myLibrary.getObjSubvalue(context.lastCall, name);
      if (value === undefined) {
        value = match;
      }
      return value;
    })
    logGray(":: file prefix will be : '" + myprefix + "'")
    context.replacePath.output = computeOptions.path.replace(context.replacePath.base, myprefix + context.replacePath.base)
  }

  fs.writeFileSync(context.replacePath.output, iconv.encode(content, 'utf-8', { addBOM: false, stripBOM: null, defaultEncoding: null }));

  //Create Dict of local values
  if (computeOptions.var) {
    console.log("Adding local variables for replace")
    var localVar = {}
    computeOptions.var.forEach(x => {
      var xs = x.split("=")
      localVar[xs[0]] = xs[1]
    });
    console.log(localVar)
  }

  console.log("context.replacePath.output:" + context.replacePath.output)
  for (let i = 0; i < runs.length; i++) {
    let content = iconv.decode(fs.readFileSync(context.replacePath.output), 'utf-8');
    console.log(`######## ${runs[i]} run ########`);
    // Replace in json, objects where the placeholder is string
    if (computeOptions.objects) {
      logGray(":: Advance replace json")
      content = content.replace(JsonRx, (match, name) => {
        let value = match
        if (name.startsWith("EnvDesc.")) {
          //Replace EnvDesc values
          value = myLibrary.getObjSubvalue(context.lastCall, name, true);
          if (value === undefined) {
            logYellow("xx " + name + " -- not found so cannot be substituted");
            value = match;
          } else {
            logGray(":: replacing " + name)
          }
        } else {
          //Replace local values
          try {
            if (localVar[name]) {
              value = localVar[name]
              logGray(":: replacing " + name)
            } else {
              logYellow("xx " + name + " -- not found so cannot be substituted");
            }
          } catch {
            logYellow("No local variable '" + name + "'")
          }
        }
        return value;
      })
    }

    // Simple replace
    content = content.replace(myRx, (match, name) => {
      let value = match
      if (name.startsWith("EnvDesc.")) {
        //Replace EnvDesc values
        value = myLibrary.getObjSubvalue(context.lastCall, name);
        if (value === undefined) {
          logYellow("xx " + name + " -- not found so cannot be substituted");
          value = match;
        } else {
          logGray(":: replacing " + name)
        }
      } else {
        //Replace local values
        try {
          if (localVar[name]) {
            value = localVar[name]
            logGray(":: replacing " + name)
          } else {
            logYellow("xx " + name + " -- not found so cannot be substituted");
          }
        } catch {
          logYellow("No local variable '" + name + "'")
        }
      }
      return value;
    })
    fs.writeFileSync(context.replacePath.output, iconv.encode(content, 'utf-8', { addBOM: false, stripBOM: null, defaultEncoding: null }));
  }

  logGray(":: output file : " + context.replacePath.output);
}



function printHelp() {
  const sections = [
    {
      header: 'description',
      content: 'envdesc-cli is a tool to test and locally interact with envdesc function'
    },
    {
      header: '-- usage',
      content: '$ findar <command> <verb> <commandOptions>'
    },
    {
      header: '<command> list',
      content: [
        { name: chalk.green('compute'), summary: 'Set of commands to interact with envdesc function.' },
        { name: 'help', summary: 'Display this help information.' }
      ]
    },
    {
      header: chalk.green('## compute <verb> list'),
      content: [
        { name: 'show', summary: 'Display the result of the compute operation on the current context.' },
        { name: 'replace', summary: 'Replace the placeholders in the file from the result of the compute operation. (path options is source file)' }
      ]
    },
    {
      header: chalk.green('## compute <commandOptions> list'),
      optionList: [
        {
          name: 'flat',
          description: 'Set the show result in a flat display format',
          type: Boolean,
          alias: 'f'
        },
        {
          name: 'block',
          description: 'Filter the result on a specific block (can be sub-block or value)',
          alias: 'b'
        },
        {
          name: 'short',
          description: 'Hide the Status block from results',
          type: Boolean,
          alias: 's'
        },
        {
          name: 'path',
          description: 'path of the file with entries to replace',
          alias: 'p'
        },
        {
          name: 'input',
          description: 'path of the file with list of entries that can be used for replacement',
          alias: 'i'
        },

        {
          name: 'newName',
          description: 'When using replace, name of the new file (override prefix from conf)',
          alias: 'n'
        },
        {
          name: 'var',
          description: 'During replace, add additional variables/values to use',
          multiple: true
        },
        {
          name: 'objects',
          description: 'During replace, remove the double quote if the target is an object',
          type: Boolean,
          alias: 'k'
        }
      ]
    },
    {
      header: chalk.green('## compute examples'),
      content: [
        {
          desc: '1. Simple exec. ',
          example: '$ envdesc compute show'
        },
        {
          desc: '2. Override context. ',
          example: '$ envdesc ' + chalk.gray('-b myEnv') + ' compute show'
        },
        {
          desc: '3. Filter block. ',
          example: '$ envdesc compute show ' + chalk.gray('-b Top.SubTop')
        },
        {
          desc: '4. Export to file. ',
          example: '$ envdesc compute export ' + chalk.gray('-p ./top.json')
        },
        {
          desc: '5. Replace token from file to another file. ',
          example: '$ envdesc compute replace ' + chalk.gray('-p ./input.json -n ./output.json')
        }
      ]
    },
  ]

  const usage = commandLineUsage(sections)
  console.log(usage)
  return
}

exports.computeShow = computeShow;
exports.computeReplace = computeReplace;
exports.printHelp = printHelp;
