# jsonata-extended
[![Build Status](https://travis-ci.org/martinholden-skillsoft/jsonata-extended.svg?branch=master)](https://travis-ci.org/martinholden-skillsoft/jsonata-extended)

Extended JSONata object with custom functions

This can be used to add extended functions to the standard [JSONata](https://www.npmjs.com/package/jsonata)

It has the same signature as the standard and so can be used as a dropin replacement.

It is NOT published to NPMJS and so install from this repo

## Installation

```bash
npm install https://github.com/martinholden-skillsoft/jsonata-extended
```

## Example - Node

```javascript
// const jsonata = require('jsonata');
const jsonata = require('jsonata-extended');
const expr = jsonata(
  '$htmltotext("<p>Leadership has a dark side; a &#34;leadership shadow&#34; that often creates an unknown; lurking fear.</p>")'
);
const result = expr.evaluate();
```

## Example - Browser

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>JSONata Extended Test</title>
    <script src="https://cdn.jsdelivr.net/npm/jsonata/jsonata.min.js"></script>
    <script src="jsonata-extended.js"></script>
    <script>
      function runTransform() {
        var json = JSON.parse(document.getElementById('json').value);
        var transform = document.getElementById('transform').value;
        var resultJSONataExtended = jsonataExtended(transform).evaluate(json);
        document.getElementById('results').innerHTML = JSON.stringify(resultJSONataExtended);
      }
    </script>
  </head>
  <body>
    <textarea id="json">{ "name": "Wilbur", "uuid": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000" }</textarea>
    <textarea id="transform">$.{ "responsename": name, "responseuuid": uuid, "responseshortenUuid" : $shortenUuid ? $shortenUuid(uuid) : "function not defined"}</textarea>
    <button onclick="runTransform()">Click me</button>
    <p id="results"></p>
  </body>
</html>
```

## JSDOCS

[JavaScript Documentation](https://martinholden-skillsoft.github.io/jsonata-extended/doc/)

## License

MIT © Martin Holden
