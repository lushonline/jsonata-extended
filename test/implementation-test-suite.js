/* eslint no-param-reassign: ["error", 
      { "props": true, 
        "ignorePropertyModificationsFor": ["item"] }
] */
const chai = require('chai');

const { describe, it } = require('mocha');
const jsonataOriginal = require('jsonata');
const jsonataFunctions = require('../src/lib/jsonata-functions');

// This is the start of the set of tests associated with the test cases
// found in the test-suite directory.
describe('Implementation Test Suite', () => {
  it('Confirm Success when registerWithJSONATA passed JSONata Expression Object', () => {
    let expr;
    // Start by trying to compile the expression associated with this test case
    try {
      expr = jsonataOriginal('$exists($languageInfo)');
      jsonataFunctions.registerWithJSONATA(expr);
    } catch (e) {
      throw new Error(`Got an unexpected exception: ${e.message}`);
    }
    // If we managed to compile the expression and add our custom functions...
    if (expr) {
      const result = expr.evaluate();
      chai.expect(result).to.equal(true);
    }
  });
  it('Confirm error thrown when registerWithJSONATA passed String', () => {
    let error = null;
    try {
      jsonataFunctions.registerWithJSONATA('');
    } catch (err) {
      error = err;
    }
    chai.expect(error).to.be.an('Error');
    chai.expect(error.message).to.equal('Invalid JSONata Expression');
  });

  it('Confirm error thrown when registerWithJSONATA passed undefined', () => {
    let error = null;
    try {
      jsonataFunctions.registerWithJSONATA();
    } catch (err) {
      error = err;
    }
    chai.expect(error).to.be.an('Error');
    chai.expect(error.message).to.equal('Invalid JSONata Expression');
  });
});
