const jsonataOriginal = require('jsonata');
const jsonataFunctions = require('./jsonata-functions');

/**
 * Return a JSONata expression object that includes the custom functions registered
 *
 * @param {Object} expr - JSONata expression {@link https://www.npmjs.com/package/jsonata|JSONata NPM}
 * @param {boolean} options - recover: attempt to recover on parse error
 * @example <caption>Example using the extended JSONata as a dropin replacement for the standard {@link https://www.npmjs.com/package/jsonata|JSONata NPM}</caption>
 * // const jsonata = require('jsonata');
 * const jsonata = require('./lib/jsonata/jsonata-extended');
 * const expr = jsonata('$htmltotext("<p>Leadership has a dark side; a &#34;leadership shadow&#34; that often creates an unknown; lurking fear.</p>")');
 * const result = expr.evaluate();
 * @see {@link https://www.npmjs.com/package/jsonata|JSONata NPM}
 * @returns {{evaluate: evaluate, assign: assign, registerFunction: registerFunction,
 *            ast: ast, errors: errors}} Evaluated expression
 */
function jsonataExtended(expr, options) {
  const expression = jsonataOriginal(expr, options);
  jsonataFunctions.registerWithJSONATA(expression);
  return expression;
}

module.exports = jsonataExtended;
