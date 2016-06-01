var hg = require('hg')
var Promise = require('bluebird')

var here = Promise.promisifyAll(new hg.HGRepo('.'))
var p_make_parsers = Promise.promisify(hg.makeParser)

var nextversion = 'v'+process.env.npm_package_version

function verify_essential(status, fname) {
    if(status[fname] == '?') {
        throw new Error(fname + ' is untracked; please add, commit and re-run')
    }

    if(status[fname]) {
        // verify_repo_clean has already checked for this unless --ignore-modification
        throw new Error('Cannot --ignore-modification of ' + fname)
    }
}

function verify_repo_clean(status) {
    if(process.env.npm_config_ignore_modification) {
        return true
    }

    for(var file in status) {
        if('ARMD'.indexOf(status[file]) >= 0) {
            throw new Error('Modification detected: ' + file)
        }
    }
}

function verify_tag_new(tags) {
    if(tags[nextversion]) {
        throw new Error('Version already in repo tags: ' + nextversion)
    }
}

function verify_package_modified(status) {
    if(!status['package.json']) {
        throw new Error('npm seems not to have modified package.json; bailing')
    }
}

switch (process.env.npm_lifecycle_event) {
    case 'preversion':
        Promise.all([
            p_make_parsers(),
            here.statusAsync(),
            here.tagsAsync()
        ]).then(function(results) {
            var parsers = results[0]
            var status = parsers.status(results[1][0])
            var tags = parsers.tags(results[2][0])

            verify_repo_clean(status)
            verify_essential(status, 'package.json')
            verify_essential(status, 'npm-shrinkwrap.json')
            verify_tag_new(tags)
        }).catch(function(err) {
            console.error(err)
            process.exit(3)
        })
        break

    case 'postversion':
        var options = { '-m': 'Incrementing version to ' + nextversion }

        Promise.all([
            p_make_parsers(),
            here.statusAsync()
        ]).then(function(results) {
            var parsers = results[0]
            var status = parsers.status(results[1][0])

            verify_package_modified(status)

            var to_commit = ['package.json']
            if(status['npm-shrinkwrap.json']) {
                to_commit.push('npm-shrinkwrap.json')
            }

            return here.commitAsync(to_commit, options)
        }).then(function() {
            return here.tagAsync(nextversion)
        }).catch(function(err) {
            console.error(err)
            process.exit(4)
        })
        break

    default:
        console.error('This module is expected to be used from your package.json thus:\n')
        console.error('"scripts": {\n  "preversion": "node ./node_modules/npm-hg-version/hg-version.js",')
        console.error('  "postversion": "node ./node_modules/npm-hg-version/hg-version.js"\n},')
        process.exit(2)
}
