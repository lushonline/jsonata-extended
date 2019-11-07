/* eslint no-param-reassign: ["error", 
      { "props": true, 
        "ignorePropertyModificationsFor": ["item"] }
] */

/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 *
 * Adapted by Martin Holden - 2019
 */

const fs = require('fs');
const path = require('path');
const chai = require('chai');

const { describe, it } = require('mocha');
const jsonata = require('../lib/jsonata-extended');

/**
 * Based on the collection of datasets and the information provided as part of the testcase,
 * determine what input data to use in the case (may return undefined).
 *
 * @param {Object} datasets Object mapping dataset names to JS values
 * @param {Object} testcase Testcase data read from testcase file
 * @returns {any} The input data to use when evaluating the jsonata expression
 */
const resolveDataset = (datasets, testcase) => {
  if ('data' in testcase) {
    return testcase.data;
  }
  if (testcase.dataset === null) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(datasets, testcase.dataset)) {
    return datasets[testcase.dataset];
  }
  throw new Error(
    `Unable to find dataset ${testcase.dataset} among known datasets, are you sure the datasets directory has a file named ${testcase.dataset}.json?`
  );
};

/**
 * Protect the process/browser from a runnaway expression
 * i.e. Infinite loop (tail recursion), or excessive stack growth
 *
 * @param {Object} expr - expression to protect
 * @param {Number} timeout - max time in ms
 * @param {Number} maxDepth - max stack depth
 */
const timeboxExpression = (expr, timeout, maxDepth) => {
  let depth = 0;
  const time = Date.now();

  const checkRunnaway = () => {
    if (depth > maxDepth) {
      // stack too deep
      throw new Error(
        'Stack overflow error: Check for non-terminating recursive function.  Consider rewriting as tail-recursive.'
      );
    }
    if (Date.now() - time > timeout) {
      // expression has run for too long
      throw new Error('Expression evaluation timeout: Check for infinite loop');
    }
  };

  // register callbacks
  expr.assign('__evaluate_entry', () => {
    depth += 1;
    checkRunnaway();
  });

  expr.assign('__evaluate_exit', () => {
    depth -= 1;
    checkRunnaway();
  });
};

const groups = fs
  .readdirSync(path.join(__dirname, 'test-suite', 'groups'))
  .filter(name => !name.endsWith('.json'));

/**
 * Simple function to read in JSON
 * @param {string} dir - Directory containing JSON file
 * @param {string} file - Name of JSON file (relative to directory)
 * @returns {Object} Parsed JSON object
 */
function readJSON(dir, file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, dir, file)).toString());
  } catch (e) {
    throw new Error(`Error reading ${file} in ${dir} : ${e.message}`);
  }
}

const datasets = {};
const datasetnames = fs.readdirSync(path.join(__dirname, 'test-suite', 'datasets'));

datasetnames.forEach(name => {
  datasets[name.replace('.json', '')] = readJSON(path.join('test-suite', 'datasets'), name);
});

// This is the start of the set of tests associated with the test cases
// found in the test-suite directory.
describe('Functions Test Suite', () => {
  // Iterate over all groups of tests
  groups.forEach(group => {
    const filenames = fs
      .readdirSync(path.join(__dirname, 'test-suite', 'groups', group))
      .filter(name => name.endsWith('.json'));
    // Read JSON file containing all cases for this group
    let cases = [];
    filenames.forEach(name => {
      const spec = readJSON(path.join('test-suite', 'groups', group), name);
      if (Array.isArray(spec)) {
        spec.forEach(item => {
          if (!item.description) {
            item.description = name;
          }
        });
        cases = cases.concat(spec);
      } else {
        if (!spec.description) {
          spec.description = name;
        }
        cases.push(spec);
      }
    });
    describe(`Group: ${group}`, () => {
      // Iterate over all cases
      for (let i = 0; i < cases.length; i += 1) {
        // Extract the current test case of interest
        const testcase = cases[i];

        // if the testcase references an external jsonata file, read it in
        if (testcase['expr-file']) {
          testcase.expr = fs
            .readFileSync(
              path.join(__dirname, 'test-suite', 'groups', group, testcase['expr-file'])
            )
            .toString();
        }

        // Create a test based on the data in this testcase
        it(`${testcase.description}: ${testcase.expr}`, () => {
          let expr;
          // Start by trying to compile the expression associated with this test case
          try {
            expr = jsonata(testcase.expr);
            // If there is a timelimit and depth limit for this case, use the
            // `timeboxExpression` function to limit evaluation
            if ('timelimit' in testcase && 'depth' in testcase) {
              this.timeout(testcase.timelimit * 2);
              timeboxExpression(expr, testcase.timelimit, testcase.depth);
            }
          } catch (e) {
            // If we get here, an error was thrown.  So check to see if this particular
            // testcase expects an exception (as indicated by the presence of the
            // `code` field in the testcase)
            if (testcase.code) {
              // See if we go the code we expected
              chai.expect(e.code).to.equal(testcase.code);
              // If a token was specified, check for that too
              if (Object.prototype.hasOwnProperty.call(testcase, 'token')) {
                chai.expect(e.token).to.equal(testcase.token);
              }
            } else {
              // If we get here, something went wrong because an exception
              // was thrown when we didn't expect one to be thrown.
              throw new Error(`Got an unexpected exception: ${e.message}`);
            }
          }
          // If we managed to compile the expression...
          if (expr) {
            // Load the input data set.  First, check to see if the test case defines its own input
            // data (testcase.data).  If not, then look for a dataset number.  If it is -1, then
            // that means there is no data (so use undefined).  If there is a dataset number, look
            // up the input data in the datasets array.
            const dataset = resolveDataset(datasets, testcase);

            // Test cases have three possible outcomes from evaluation...
            if ('undefinedResult' in testcase) {
              // First is that we have an undefined result.  So, check
              // to see if the result we get from evaluation is undefined
              const result = expr.evaluate(dataset, testcase.bindings);
              chai.expect(result).to.deep.equal(undefined);
            } else if ('result' in testcase) {
              // Second is that a (defined) result was provided.  In this case,
              // we do a deep equality check against the expected result.
              const result = expr.evaluate(dataset, testcase.bindings);
              chai.expect(result).to.deep.equal(testcase.result);
            } else if ('error' in testcase) {
              // If an error was expected,
              // we do a deep equality check against the expected error structure.
              chai
                .expect(() => {
                  expr.evaluate(dataset, testcase.bindings);
                })
                .to.throw()
                .to.deep.contain(testcase.error);
            } else if ('code' in testcase) {
              // Finally, if a `code` field was specified, we expected the
              // evaluation to fail and include the specified code in the
              // thrown exception.
              chai
                .expect(() => {
                  expr.evaluate(dataset, testcase.bindings);
                })
                .to.throw()
                .to.deep.contain({ code: testcase.code });
            } else {
              // If we get here, it means there is something wrong with
              // the test case data because there was nothing to check.
              throw new Error('Nothing to test in this test case');
            }
          }
        });
      }
    });
  });
});
