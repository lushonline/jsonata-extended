/* eslint-disable no-param-reassign */
/* eslint-disable import/no-commonjs */

/**
 * Define an @signature tag
 */
exports.defineTags = (dictionary) => {
  dictionary.defineTag('signature', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: (doclet, tag) => {
      doclet.signature = tag.value;
    },
  });
};
