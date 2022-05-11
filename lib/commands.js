const chalk = require('chalk');
//const prettyjson = require('prettyjson');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');

var myLibrary = require(__dirname + '/index.js');

function logGreen(log) { console.log(chalk.green(log)) }
function logYellow(log) { console.log(chalk.yellow(log)) }
function logGray(log) { console.log(chalk.gray(log)) }


async function computeReplace(context, inputFile, computeOptions, replacePrefix) {
  var tokenPrefix = "#{"
  var tokenSuffix = "}#"
  var myRx = new RegExp(tokenPrefix + '((?:(?!' + tokenSuffix + '|' + tokenPrefix + ').)*)' + tokenSuffix, 'gm');
  var JsonRx = new RegExp('"' + tokenPrefix + '((?:(?!' + tokenSuffix + '|' + tokenPrefix + ').)*)' + tokenSuffix + '"', 'gm');

  var content = ""
  try {
    content = iconv.decode(fs.readFileSync(inputFile), 'utf-8');
  } catch (e) {
    console.log("Exception : " + e)
    return
  }

  context.replacePath = path.parse(inputFile)
  if (computeOptions.outputfile) {
    context.replacePath.output = context.replacePath.dir + "/" + computeOptions.outputfile
  } else {
    var myprefix = replacePrefix.replace(myRx, (match, name) => {
      let value = myLibrary.getObjSubvalue(context.lastCall, name);
      if (value === undefined) {
        value = match;
      }
      return value;
    })
    logGray(":: file prefix will be : '" + myprefix + "'")
    context.replacePath.output = inputFile.replace(context.replacePath.base, myprefix + context.replacePath.base)
  }

  fs.writeFileSync(context.replacePath.output, iconv.encode(content, 'utf-8', { addBOM: false, stripBOM: null, defaultEncoding: null }));

  //Create Dict of local values
  if (computeOptions.extravar.length > 0) {
    console.log("Adding local variables for replace")
    var localVar = {}
    computeOptions.extravar.forEach(x => {
      var xs = x.split("=")
      localVar[xs[0]] = xs[1]
    });
    console.log(localVar)
  }

  console.log("context.replacePath.output:" + context.replacePath.output)
  content = iconv.decode(fs.readFileSync(context.replacePath.output), 'utf-8');
  // Replace in json, objects where the placeholder is string
  if (computeOptions.objects == true) {
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

  logGray(":: output file : " + context.replacePath.output);
}




exports.computeReplace = computeReplace;
