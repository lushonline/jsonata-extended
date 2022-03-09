/* eslint-disable import/no-commonjs */
const _ = require('lodash');

const doclets = [];

exports.handlers = {
  // The processingComplete event is fired after JSDoc updates the parse results
  // to reflect inherited and borrowed symbols.
  processingComplete(e) {
    e.doclets.forEach((doclet) => {
      const cleaned = _.omitBy(doclet, (value, key) => {
        return key === 'meta' || key === 'comment';
      });

      doclets.push(cleaned);
    });
    // eslint-disable-next-line no-console

    const functions = doclets.filter((value) => {
      return value.kind === 'function' && value.scope === 'inner' && value.access === 'private';
    });
    console.log(JSON.stringify(functions));
  },
};
