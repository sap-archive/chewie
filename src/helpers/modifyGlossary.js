'use strict';
const log = require('../helpers/logger'),
  mkmeta = require('marked-metadata');

/**
 * This function modifies all glossary partials during copy
 * @return {Function} - anonymous function that can be used in tap operations on streap during gulp copy
 */
function modifyGlossary(name) {
  return (file) => {
    let md = new mkmeta(file.path),
      topic,
      lockCase;

    try {
      md = md.metadata();

      if (md.term && md.description) {
        topic = `topic: ${name}`;

        //new line is added here as this metadata is not common and we don't want to have an extra white space in metadatas
        lockCase = md.lock_case ? `\nlock_case: ${md.lock_case}` : '';

        // we have escape " because otherwise html syntax is invalid
        const description = md.description.replace(/'/g, '&quot;');

        file.contents = Buffer.concat([
          new Buffer(
            `---\nterm: ${md.term}\ndescription: ${description}\n${topic}${lockCase}\ninternal: false\n---\n`
          ),
          new Buffer(
            `<span class='u-help-label' data-toggle='tooltip' data-placement='top' title='${description}'>${md.term}</span>`
          )
        ]);
      }
    } 
    catch (e) {
      return;
    }
  };
}

module.exports = modifyGlossary;
