const chalk = require('chalk');
const iconv = require('iconv-lite');
const fs = require('fs');
const sortKeys = require('sort-keys');

function logGreen(log) { console.log(chalk.green(log)) }
function logYellow(log) { console.log(chalk.yellow(log)) }
function logGray(log) { console.log(chalk.gray(log)) }



var getObjSubvalue = function (envDescObj, subvalue, objReturn = false) {
  // removing "EnvDesc."
  let subvalueLoop = subvalue.substring(8);
  let returnValue = undefined;
  let objPointer = envDescObj;
  try {
    //consol.log("Replacing -- " + subvalue)
    subvalueLoop.split(".").forEach(element => {
      objPointer = objPointer[element];
    });
    if (typeof objPointer === 'object') {
      returnValue = JSON.stringify(objPointer);
    } else {
      if (objReturn) {
        returnValue = '"' + String(objPointer) + '"';
      } else {
        returnValue = String(objPointer);
      }

    }
  }
  catch (_a) {
    return undefined;
  }
  if (objPointer == null) {
    return undefined;
  }
  return returnValue;
}



function readInputFile(context, computeOptions) {

  if (fs.existsSync(computeOptions.inputConf)) {
    context.lastCall = sortKeys(JSON.parse(iconv.decode(fs.readFileSync(computeOptions.inputConf), 'utf-8')))
  } else {
    logYellow('// missing "input" command argument')
  }

  return (context)
}


exports.getObjSubvalue = getObjSubvalue;
exports.readInputFile = readInputFile;
