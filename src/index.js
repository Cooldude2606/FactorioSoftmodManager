#! /usr/bin/env node
const program = require('commander')
const fs = require('fs-extra')
const config = require('./config')
const consoleLog = require('./lib/consoleLog')

// a common function used to auto format the dir and find the softmod which is being used
async function softmodDirVal(name='.',dir='.',cmd,path) {
    // if the name is a path then it is used instead of dir
    if (name.includes('/') || name.includes('\\') && dir == '.') {dir = name;name='.'}
    process.env.dir = dir
    const Softmod = require('./lib/Softmod') // loaded here because of process.env.dir
    // if no module is given then it will look in the current dir to find a json file
    let softmod
    if (name == '.') {
        if (fs.existsSync(process.env.dir+config.jsonFile)) {
            const json = fs.readJSONSync(process.env.dir+config.jsonFile)
            if (json) softmod = Softmod.fromJson(json)
            else {
                const path = process.env.dir
                const dirName = path.lastIndexOf('/') > 0 && path.substring(path.lastIndexOf('/')+1) || path.lastIndexOf('\\') > 0 && path.substring(path.lastIndexOf('\\')+1) || undefined
                if (dirName) {
                    consoleLog('error','No softmod name supplied and no json found. Using dir name as module name.')
                    softmod = new Softmod(dirName,cmd.parent.modulesVersion ? cmd.parent.modulesVersion : softmodVersionQuery)
                } else {
                    return
                }
            }
        }
    } else {
        const [softmodName,softmodVersionQuery] = Softmod.extractVersionFromName(name,true)
        softmod = new Softmod(softmodName,cmd.parent.modulesVersion ? cmd.parent.modulesVersion : softmodVersionQuery)
        if (!cmd.parent.download) {
            const json = await softmod.readJson(true)
            if (!json) {
                consoleLog('error','Softmod not installed and download is disabled')
                return
            }
        }
    }
    process.env.download = cmd.parent.download || ''
    process.env.useForce = cmd.parent.force || ''
    process.env.skipUserInput = cmd.parent.acceptAll || cmd.parent.declineAll || ''
    process.env.skipUserInputValue = cmd.parent.acceptAll || ''
    // runs the command
    require(path)(softmod,cmd)
}

// displays info about a softmod; either by downloading the json or by reading the installed json
program
    .command('info [name] [dir]')
    .description('View info on a module, collection or secenario')
    .action((name,dir,cmd) => softmodDirVal(name,dir,cmd,'./commands/info'))

// used to create a new softmod where you want to make a json file
program
    .command('init [name] [dir]')
    .description('Init a new module, promts can be skiped with command line options')
    .option('-u, --url <url>','defines the url location for the module')
    .option('-a, --author <author>','defines the author for the module')
    .option('-l, --license <license>','defines the license type or location of the modules license')
    .option('-c, --contact <contact>','defines the contact method and/or location for this contact')
    .option('-k, --key-words <keyword>,[keyword]','defines a list of key words for the module',val => val.split(',').map(s => s.trim()))
    .action((name,dir,cmd) => softmodDirVal(name,dir,cmd,'./commands/init'))

// builds the json files for the modules and then moves them to exports; also zips the modules and moves them to the exports
program
    .command('build [name] [dir]')
    .alias('b')
    .description('Builds the module or collection and will give the exports which can then be added to the host')
    .option('-b, --create-backup','the old json will be renamed to have .bak on the end of the name')
    .option('-o, --output-dir','the dir that the zips and jsons will be saved to relative to the active dir')
    .option('-a, --all','builds all modules that are insatlled')
    .option('-i, --version-increment [major|minor|patch]','increments the version number in a certain area, default patch')
    .option('-I, --version-increment-all [major|minor|patch]','increments the version number in a certain area, for all modules, default patch')
    .action((name,dir,cmd) => softmodDirVal(name,dir,cmd,'./commands/build'))

// install command (used to install a scenario/module/collection/submodule)
program
    .command('install [name] [dir]')
    .alias('i')
    .description('Installs all modules that are required to run a secario or adds a dependencie for a module')
    .option('-d, --dry-run','will not download any thing but will move and create files')
    .option('-z, --keep-zips','does not remove zip files after download')
    .option('-j, --keep-jsons','does not remove json dir after download')
    .action((name,dir,cmd) => softmodDirVal(name,dir,cmd,'./commands/install'))

// uninstalls the files for a sub module and any dependies no longer required
program
    .command('uninstall [name] [dir]')
    .alias('uni')
    .description('Uninstalls this module and any dependices that are exclusive to the selected module')
    .option('-r, --no-recursion','uninstalls all dependices if there are no longer needed')
    .option('-j, --clear-jsons','removes temp json dir')
    .option('-a, --all','remove all fsm files from this scenario')
    .action((name,dir,cmd) => softmodDirVal(name,dir,cmd,'./commands/uninstall'))


// host command (starts a host server, in furture this will connect to a master to allow more than a single host)
program
    .command('host [dir]')
    .alias('h')
    .description('Sets up a web api endpoint on this machine; a place holder for allowing uploading of modules')
    .option('-p, --port','port to host server on')
    .option('-u, --update','loads new modules from the modules folder into the database')
    .option('-i, --use-index','loads new modules from the json dir')
    .option('-w, --watch [interville]','watchs the selected dir for new json files and adds them to the database, then removes them')
    .option('-d, --dev','allows use of /raw route for dev purposes')
    .action((dir='.',cmd) => {
        process.env.dir = dir
        require('./commands/host')(cmd)
    })

// just a command that is used to test certain parts of the code without forcing a path; no constant function
program
    .command('test [dir]')
    .description('a test command')
    .action(async (dir='.',cmd) => {
        process.env.dir = dir
        process.env.download = true
        const Softmod = require('./lib/Softmod')
        const softmod = new Softmod('ExpGamingCore')
        await softmod.updateFromJson()
        console.log(softmod)
        console.log(softmod.submodules)
    })

// program info
program
    .version('1.1.9')
    .usage('fsm <command> [options]')
    .option('-d, --no-download','will not download any files')
    .option('-f, --force','forces the prossess to run when it would cancel normally')
    .option('-y, --accept-all','skips all prompts, accepting all')
    .option('-n, --decline-all','skips all prompts, accepting only to contuine install')
    .option('-v, --module-version <version>','defines which version will be acted on (when aplicaible)')
    .description('A cli to download and install softmods for a factorio scenario')

// if no command then it displays help
if (process.argv[2]) program.parse(process.argv)
else program.help()

module.exports = () => {
    program.parse(arguments.join(' '))
}