# jsonata-extended

Extended JSONata object with custom functions

This can be a drop in substitue for the standard [JSONata](https://www.npmjs.com/package/jsonata)

It is NOT published to NPMJS and so install from this repo

## Installation

```bash
npm install https://github.com/martinholden-skillsoft/jsonata-extended
```

## Example

```javascript
// const jsonata = require('jsonata');
const jsonata = require('jsonata-extended');
const expr = jsonata(
  '$htmltotext("<p>Leadership has a dark side; a &#34;leadership shadow&#34; that often creates an unknown; lurking fear.</p>")'
);
const result = expr.evaluate();
```

## JSDOCS

[JavaScript Documentation](https://martinholden-skillsoft.github.io/jsonata-extended/doc/)

## License

MIT © Martin Holden
