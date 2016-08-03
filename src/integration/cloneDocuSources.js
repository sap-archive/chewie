'use strict';
const eachRegTopic = require('../helpers/registryIterator'),
  misc = require('../helpers/misc'),
  creator = require('../helpers/creator'),
  async = require('async'),
  fs = require('fs'),
  git = require('gulp-git'),
  log = require('../helpers/logger'),
  copier = require('../helpers/copier'),
  repositoriesArray = [];


/**
 * This function clones all provided sources or only specified topics
 * @param {Array} [registry] - array of full registry
 * @param {Object} [config] - basic integration configuration
 * @param {Function} [next] - callback for asynch operations
 */
function cloneDocuSources(registry, config, topics, next) {

  iterateRegClone(registry, config, topics, next);
}

//simple abstraction, helper to use in callback
function iterateRegClone(registry, config, topics, next) {

  eachRegTopic.async(registry, config, next, (topicDetails, cb) => {

    //clone repo to a given location basing on data provided in the registry
    topicDetails.local ? copier.copyDocuRepo(topicDetails, cb) : cloneDocuRepo(topicDetails, config, topics, cb);
  });
}


/**
 * This function clones a given topic's repository to a given location and logouts proper custom info
 * @param {Object} [topicDetails] - holds details of the repo that needs to be cloned.
 * @param {Object} [config] - basic integration configuration
 * @param {Function} [cb] - callback for asynchronous operation
 */
function cloneDocuRepo(topicDetails, config, topics, cb) {

  const version = topicDetails.version || '';

  git.clone(topicDetails.location, {args: `${topicDetails.sourcesCloneLoc} -b ${topicDetails.branchTag}`}, (err) => {

    if (err) {
      if(err.message && err.message.indexOf('already exists and is not an empty directory') !== -1) {
        log.warning(`${topicDetails.type} - ${topicDetails.name} ${version} is already cloned, use --force to download repository again`);
      }
      else {
        log.error(`${topicDetails.type} - ${topicDetails.name} ${version} wasn't successfully cloned because of: ${err}`);

        // take care of not cloned repositories
        return _createMatrixWithRepositories(topicDetails, config, 'notClonedRepositories', cb);
      }
    }
    else {
      log.info(`${topicDetails.type} - ${topicDetails.name} ${version} successfully cloned into ${topicDetails.sourcesCloneLoc} using ${topicDetails.branchTag} branch or tag`);

      if (topics) return _createMatrixWithRepositories(topicDetails, config, 'indepenedentDocuRepositories', cb);
    }
    cb();
  });
}

module.exports = cloneDocuSources;

/**
 * This function creates a JSON object in which names of not cloned repositories are stored.
 * @param {Object} [topicDetails] - holds details of the repo that needs to be cloned.
 * @param {Object} [config] - basic integration configuration
 * @param {Function} [cb] - callback for asynchronous operation
 */
function _createMatrixWithRepositories(topicDetails, config, fileName, cb) {

  //push to array all not cloned repositories
  repositoriesArray.push(topicDetails.clonedGenRNDestLocation, topicDetails.clonedGenRNDestLocationInternal, topicDetails.clonedGenDestLocation, topicDetails.clonedGenDestLocationInternal);

  //push to array all not cloned repositories - latest versions (for services)
  if (topicDetails.isService) repositoriesArray.push(topicDetails.clonedGenRNDestLocationLatest, topicDetails.clonedGenRNDestLocationInternalLatest, topicDetails.clonedGenDestLocationLatest, topicDetails.clonedGenDestLocationInternalLatest);

  //write array the file
  creator.createFile(`${config.tempLocation}/${fileName}.json`, repositoriesArray, (err) => {
    if (err) log.error('Something went wrong. File could not be created. No repositories will be backup.');
    return cb();
  });

}
