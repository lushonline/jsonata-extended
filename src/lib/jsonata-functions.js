/**
 * Extension functions for JSONata
 * @module jsonata-functions
 * @exports registerWithJSONATA
 */
const { convert } = require('html-to-text');
const uuidvalidate = require('uuid-validate');
const UuidEncoder = require('uuid-encoder');
const _ = require('lodash');
const LanguageTag = require('rfc5646');
const countriesList = require('countries-list');
const momentjs = require('moment');
const urlParse = require('url-parse');
const path = require('path');
const Mustache = require('mustache');
const ASCIIFolder = require('fold-to-ascii');

/**
 * Convert HTML to plain text
 * @access private
 * @param {String} value The HTML string to convert
 * @param {Object} [options={}] The options object. For more information see the {@link https://www.npmjs.com/package/html-to-text|html-to-text NPM}
 * @param {String[]|String|Boolean} [options.tables=[]] allows to select certain tables by the 'class' or 'id' attribute from the HTML document. This is necessary because the majority of HTML E-Mails uses a table based layout. Prefix your table selectors with an '.' for the 'class' and with a '#' for the 'id' attribute. All other tables are ignored. You can assign 'true' to this attribute to select all tables.
 * @param {Number} [options.wordwrap=80] defines after how many chars a line break should follow in 'p' elements. Set to 'null' or 'false' to disable word-wrapping.
 * @param {String} [options.linkHrefBaseUrl=null] allows you to specify the server host for href attributes, where the links start at the root ('/'). For example, 'linkHrefBaseUrl = 'http://asdf.com'' and '<a href='/dir/subdir'>...</a>' the link in the text will be 'http://asdf.com/dir/subdir'. Keep in mind that 'linkHrefBaseUrl' shouldn't end with a '/'.
 * @param {Boolean} [options.hideLinkHrefIfSameAsText=false] allows you to specify the server host for href attributes, where the links start at the root ('/'). For example, 'linkHrefBaseUrl = 'http://asdf.com'' and '<a href='/dir/subdir'>...</a>' the link in the text will be 'http://asdf.com/dir/subdir'. Keep in mind that 'linkHrefBaseUrl' shouldn't end with a '/'.
 * @param {Boolean} [options.noLinkBrackets=false] dont print brackets around the link if 'true'
 * @param {Boolean} [options.ignoreHref=false] ignore all document links if 'true'
 * @param {Boolean} [options.ignoreImage=false] ignore all document images if 'true'.
 * @param {Boolean} [options.preserveNewlines=false] by default, any newlines \n in a block of text will be removed. If true, these newlines will not be removed.
 * @param {Boolean} [options.uppercaseHeadings=true] by default, headings (h1, h2, etc) are uppercased. Set to 'false' to leave headings as they are.
 * @param {Boolean} [options.singleNewLineParagraphs=false] by default, paragraphs are converted with two newlines ('\n\n'). Set to 'true' to convert to a single newline.
 * @param {String|String[]} [options.baseElement='body'] defines the tags whose text content will be captured from the html.  All content will be captured below the baseElement tags and added to the resulting text output.  This option allows the user to specify an array of elements as base elements using a single tag with css class and id parameters e.g. ['p.class1.class2#id1#id2', 'p.class1.class2#id1#id2'].
 * @param {Boolean} [options.returnDomByDefault=true] onvert the entire document if we don't find the tag we're looking for if 'true'
 * @param {String} [options.unorderedListItemPrefix=' * '] defines the string that is used as item prefix for unordered lists '&lt;ol&gt;'
 * @param {Object} [options.longWordSplit={}] describes how to wrap long words
 * @param {String[]} [options.longWordSplit.wrapCharacters=[]] is an array containing the characters that may be wrapped on, these are used in order
 * @param {Boolean} [options.longWordSplit.forceWrapOnLimit=false] defines whether to break long words on the limit if 'true'
 * @param {Object} [options.decodeOptions={}] defines the text decoding options given to 'he.decode'. For more informations see the {@link https://www.npmjs.com/package/he|HE NPM}.
 * @param {Boolean} [options.decodeOptions.isAttributeValue=false] false means that decode() will decode the string as if it were used in a text context in an HTML document. HTML has different rules for parsing character references in attribute values — set this option to true to treat the input string as if it were used as an attribute value.
 * @param {Boolean} [options.decodeOptions.strict=false] false means that decode() will decode any HTML text content you feed it, even if it contains any entities that cause parse errors. To throw an error when such invalid HTML is encountered, set the strict option to true. This option makes it possible to use he as part of HTML parsers and HTML validators.
 * @param {Object} [options.format={}}] pass an object to enable custom formatting for specific elements. By using the format option, you can specify formatting for these elements: text, image, lineBreak, paragraph, anchor, heading, table, orderedList, unorderedList, listItem, horizontalLine. Each key must be a function which eventually receive elem (the current elem), fn (the next formatting function) and options (the options passed to html-to-text).
 * @param {String} [options.whitespaceCharacters=' \t\r\n\f\u200b\u00a0'] A string of characters that are recognized as HTML whitespace.
 *
 * @example <caption>Example usage within a JSONata transform. The &lt;p&gt; tags and the HTML entities are converted</caption>
 * // returns
 * // result = 'Leadership has a dark side; a "leadership shadow" that often creates an unknown; lurking fear.'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$htmltotext("<p>Leadership has a dark side; a &#34;leadership shadow&#34; that often creates an unknown; lurking fear.</p>")');
 * const result = expr.evaluate();
 *
 * @returns {String|Void} Returns a string of the plain text, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/html-to-text|html-to-text NPM}
 * @see {@link https://www.npmjs.com/package/he|HE NPM}
 */
const htmltotext = (value, options) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  // Default options for https://www.npmjs.com/package/html-to-text
  const defaultOptions = {
    noLinkBrackets: false,
    wordwrap: null,
    whitespaceCharacters: ' \t\r\n\f\u200b\u00a0',
  };

  const localOptions = { ...defaultOptions, ...options };

  return convert(value.trim(), localOptions);
};

/**
 * Shorten the supplied UUID
 * @access private
 * @param {String} value - Properly formatted UUID
 * @param {('base2'|'base10'|'base16'|'base32'|'base36'|'base58'|'base62'|'base64'|'base64url')} [base='base36'] - A valid base to use for the process, case sensitive {@link https://www.npmjs.com/package/uuid-encoder#encoding|Encoding Options}
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = '1m5otdkthiyq143crwujacdqg'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$shortenUuid("1b49aa30-e719-11e6-9835-f723b46a2688", "base36")');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid uuid
 * @throws Will throw an error if the base is not a valid option
 * @returns {String|Void} Returns a string containing the encoded version of the uuid, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/uuid-encoder|uuid-encoder NPM}
 */
const shortenUuid = (value, base = 'base36') => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (!uuidvalidate(value)) {
    throw new Error('Invalid UUID');
  }

  const validBasex = [
    'base2',
    'base10',
    'base16',
    'base32',
    'base36',
    'base58',
    'base62',
    'base64',
    'base64url',
  ];

  if (!validBasex.includes(base)) {
    throw new Error(`Invalid basex. Valid values: ${validBasex.join(',')}`);
  }

  return new UuidEncoder(base).encode(value);
};

/**
 * Encode the supplied UUID
 * @access private
 * @param {String} value - Properly formatted UUID
 * @param {('base2'|'base10'|'base16'|'base32'|'base36'|'base58'|'base62'|'base64'|'base64url')} [base='base36'] - A valid base to use for the process, case sensitive {@link https://www.npmjs.com/package/uuid-encoder#encoding|Encoding Options}
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = '1m5otdkthiyq143crwujacdqg'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$encodeUuid("1b49aa30-e719-11e6-9835-f723b46a2688", "base36")');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid uuid
 * @throws Will throw an error if the base is not a valid option
 * @returns {String|Void} Returns a string containing the encoded version of the uuid, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/uuid-encoder|uuid-encoder NPM}
 */
const encodeUuid = (value, base = 'base36') => {
  return shortenUuid(value, base);
};

/**
 * UnShorten the supplied shortened UUID
 * @access private
 * @param {String} value - Shortened UUID
 * @param {('base2'|'base10'|'base16'|'base32'|'base36'|'base58'|'base62'|'base64'|'base64url')} [base='base36'] - A valid base to use for the process, case sensitive {@link https://www.npmjs.com/package/uuid-encoder#encoding|Encoding Options}
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = '1b49aa30-e719-11e6-9835-f723b46a2688'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$unshortenUuid("1m5otdkthiyq143crwujacdqg", "base36")');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid uuid
 * @throws Will throw an error if the base is not a valid option
 * @returns {String|Void} Returns a string containing the encoded version of the uuid, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/uuid-encoder|uuid-encoder NPM}
 */
const unshortenUuid = (value, base = 'base36') => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const validBasex = [
    'base2',
    'base10',
    'base16',
    'base32',
    'base36',
    'base58',
    'base62',
    'base64',
    'base64url',
  ];

  if (!validBasex.includes(base)) {
    throw new Error(`Invalid basex. Valid values: ${validBasex.join(',')}`);
  }

  const result = new UuidEncoder(base).decode(value);

  return result;
};

/**
 * Decode the supplied shortened UUID
 * @access private
 * @param {String} value - Shortened UUID
 * @param {('base2'|'base10'|'base16'|'base32'|'base36'|'base58'|'base62'|'base64'|'base64url')} [base='base36'] - A valid base to use for the process, case sensitive {@link https://www.npmjs.com/package/uuid-encoder#encoding|Encoding Options}
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = '1b49aa30-e719-11e6-9835-f723b46a2688'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$decodeUuid("1m5otdkthiyq143crwujacdqg", "base36")');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid uuid
 * @throws Will throw an error if the base is not a valid option
 * @returns {String|Void} Returns a string containing the encoded version of the uuid, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/uuid-encoder|uuid-encoder NPM}
 */
const decodeUuid = (value, base = 'base36') => {
  return unshortenUuid(value, base);
};

/**
 * Get detailed information based on an RFC5646 tag for region and language
 * @access private
 * @param {String} value The RFC5646 locales to retrieve detailed information on
 *
 * @example <caption>ample usage within a JSONata transform to get detailed info with single tag with language only no locale</caption>
 * // returns
 * // result = {
 * //     "rfc5646": "es",
 * //     "region": null,
 * //     "language": {
 * //       "name": "Spanish",
 * //       "native": "Español"
 * //     }
 * //   }
 * // }
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$languageInfo("es")');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get the region native language name for a locale</caption>
 * // returns
 * // result = "中文"
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$languageInfo("zh-CN").language.native');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get the information for three locales</caption>
 * // returns
 * // result = [
 * //      {
 * //         "region": {
 * //          "name": "United States",
 * //          "native": "United States",
 * //          "phone": "1",
 * //          "continent": "NA",
 * //          "capital": "Washington D.C.",
 * //          "currency": "USD,USN,USS",
 * //          "languages": [
 * //            "en"
 * //          ],
 * //          "emoji": "🇺🇸",
 * //          "emojiU": "U+1F1FA U+1F1F8"
 * //        },
 * //        "language": {
 * //          "name": "English",
 * //          "native": "English"
 * //        },
 * //        "rfc5646": "en-US"
 * //      },
 * //      {
 * //        "region": {
 * //          "name": "France",
 * //          "native": "France",
 * //          "phone": "33",
 * //          "continent": "EU",
 * //          "capital": "Paris",
 * //          "currency": "EUR",
 * //          "languages": [
 * //            "fr"
 * //          ],
 * //          "emoji": "🇫🇷",
 * //          "emojiU": "U+1F1EB U+1F1F7"
 * //        },
 * //        "language": {
 * //          "name": "French",
 * //          "native": "Français"
 * //        },
 * //        "rfc5646": "fr-FR"
 * //      },
 * //      {
 * //        "region": {
 * //          "name": "China",
 * //          "native": "中国",
 * //          "phone": "86",
 * //          "continent": "AS",
 * //          "capital": "Beijing",
 * //          "currency": "CNY",
 * //          "languages": [
 * //            "zh"
 * //          ],
 * //          "emoji": "🇨🇳",
 * //          "emojiU": "U+1F1E8 U+1F1F3"
 * //        },
 * //        "language": {
 * //          "name": "Chinese",
 * //          "native": "中文"
 * //        },
 * //        "rfc5646": "zh-CN"
 * //      }
 * //    ]
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('( $allLocales:= ["en-US", "fr-FR", "zh-CN"]; $map($allLocales, function($v, $i, $a) { $languageInfo($v) }) )');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get a new object with the RFC5646 tag, and a string 'region (language)' representing the native locale for three locales</caption>
 * // returns
 * // result = [
 * //        {
 * //        "rfc5646": "en-US",
 * //        "locale": "United States (English)"
 * //        },
 * //        {
 * //        "rfc5646": "fr-FR",
 * //        "locale": "France (Français)"
 * //        },
 * //        {
 * //        "rfc5646": "zh-CN",
 * //        "locale": "中国 (中文)"
 * //        }
 * //      ]
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('( $allLocales:= ["en-US", "fr-FR", "zh-CN"]; $map($allLocales, function($v, $i, $a) { ( $lang := $languageInfo($v); { "rfc5646": $lang.rfc5646, "locale" : $lang.region.native & " (" & $lang.language.native &")" })}) )');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid RFC5646 language tag
 * @returns {Object[]|Void} object contain details on the region and language, region is null if language only passed. Returns undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/rfc5646|rfc5646 NPM}
 * @see {@link https://www.npmjs.com/package/countries-list|countries-list NPM}
 */
const languageInfo = (value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const langTag = new LanguageTag(value);

  const response = { rfc5646: null, region: null, language: null };

  // The language tag is valid
  if (langTag.invalid) {
    throw new Error(`Invalid RFC5646 Tag. Value: ${value}`);
  }

  response.rfc5646 = value;
  response.region = langTag.region ? countriesList.countries[langTag.region] : null;
  response.language = countriesList.languagesAll[langTag.language];
  return response;
};

/**
 * Parse the supplied URL and return the parsed values
 * @access private
 * @param {String} value - Properly formatted URL
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = {
 * //   "slashes": true,
 * //   "protocol": "http:",
 * //   "hash": "#hash",
 * //   "query": {
 * //     "param1": "string",
 * //     "param2": "true"
 * //   },
 * //   "pathname": "/p/a/t/page.html",
 * //   "auth": "user:pass",
 * //   "host": "host.com:8080",
 * //   "port": "8080",
 * //   "hostname": "host.com",
 * //   "password": "pass",
 * //   "username": "user",
 * //   "origin": "http://host.com:8080",
 * //   "href": "http://user:pass@host.com:8080/p/a/t/page.html?param1=string&param2=true#hash"
 * // }
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$parseUrl("http://user:pass@host.com:8080/p/a/t/page.html?param1=string&param2=true#hash")');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get the hostname</caption>
 * // returns
 * // result = "host.com"
 *
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$parseUrl("http://user:pass@host.com:8080/p/a/t/page.html?param1=string&param2=true#hash").hostname');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid url
 * @returns {Object|Void} Returns an object containing the parsed components of the URL, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/url-parse|url-parse NPM}
 */
const parseUrl = (value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  try {
    const { href } = new URL(value);
    return JSON.parse(JSON.stringify(urlParse(href, true)));
  } catch (err) {
    throw new Error('Invalid URL');
  }
};

/**
 * Parse the supplied path and return the parsed values
 * @access private
 * @param {String} value - Properly formatted path
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = {
 * //     "base": "page.html",
 * //     "dir": "/p/a/t",
 * //     "ext": ".html",
 * //     "name": "page",
 * //     "root": "/"
 * // }
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$parsePath("/p/a/t/page.html")');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get the file extension</caption>
 * // returns
 * // result = ".html"
 *
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$parsePath("/p/a/t/page.html").ext');
 * const result = expr.evaluate();
 *
 * @throws Will throw an error if the value is not a valid url
 * @returns {Object|Void} Returns an object containing the parsed components of the path, or undefined for undefined input
 *
 * @see {@link https://nodejs.org/api/path.html|Node Path}
 */
const parsePath = (value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  // Round trip JSON stringify/parse to strip out non propeties
  return JSON.parse(JSON.stringify(path.parse(value)));
};

/**
 * Wrapper around MomentJS {@link https://www.npmjs.com/package/moment|Moment NPM}
 * @access private
 * @param {*} args The moment parse argument options
 *
 * @example <caption>Example usage within a JSONata transform to get the year of a ISO8601 string</caption>
 * // returns
 * // result = "2017"
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$moment("2017-02-02T15:49:06Z").year()');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to get the localised Italian month name for a date</caption>
 * // returns
 * // result = "dicembre"
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('( $momentit := $moment().locale(\"it\"); $momentit.localeData().months($moment(\"12-12-1995\",\"MM-DD-YYYY\")) )');
 * const result = expr.evaluate();
 *
 * @returns {Object} A moment object
 *
 * @see {@link https://www.npmjs.com/package/moment|Moment NPM}
 */
const moment = (...args) => {
  return momentjs(...args);
};

/**
 * Wrapper around MomentJS Duration {@link https://www.npmjs.com/package/moment|Moment NPM}
 * @access private
 * @param {*} args The moment.duration argument options
 *
 * @example <caption>Example usage within a JSONata transform to get the total seconds of an ISO8601 duration string</caption>
 * // returns
 * // result = 3730
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$momentDuration(\"PT1H2M10S\").asSeconds()');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform to convert ISO8601 duration string to hh:mm:ss</caption>
 * // returns
 * // result = "74:02:10"
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('( $duration := $momentDuration(\"P3DT2H2M10S\"); $formatNumber($floor($duration.asHours()),\"#00\") & \":\" & $formatNumber($floor($duration.minutes()),\"00\") & \":\" & $formatNumber($floor($duration.seconds()),\"00\") )');
 * const result = expr.evaluate();
 *
 * @returns {Object} A moment duration object
 *
 * @see {@link https://www.npmjs.com/package/moment|Moment NPM}
 * @see {@link https://momentjs.com/docs/#/durations/|Moment Durations}
 */
const momentDuration = (...args) => {
  return momentjs.duration(...args);
};

/**
 * Render a mustache template
 * @access private
 * @param {Object} [value=] The object to use with the template
 * @param {String} [template=] The template object. For more information see the {@link https://www.npmjs.com/package/mustache|mustache NPM}
 *
 * @example <caption>Example usage within a JSONata transform for converting object</caption>
 * // returns
 * // result = 'Martin Holden is a Learner'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$mustache( { "name" : "Martin Holden" , "role" : "Learner"}, \"{{name}} is a {{role}}\")');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform for converting more complex object</caption>
 * // returns
 * // result = '<h1>Nincompoopery: Why Your Customers Hate You--And How to Fix It</h1><h2>Authors:</h2><ul><li>John R. Brandt</li></ul><p>HarperCollins Leadership&copy;2019</p>'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$mustache({ "title" : "Nincompoopery: Why Your Customers Hate You--And How to Fix It", "publication" : { "copyrightYear": 2019, "isbn": "9781400213672", "publisher": "HarperCollins Leadership" } , "authors" : ["John R. Brandt"]}, "<h1>{{title}}</h1>{{#authors.length}}<h2>Authors:</h2><ul>{{#authors}}<li>{{.}}</li>{{/authors}}</ul>{{/authors.length}}{{#publication}}<p>{{publisher}}&copy;{{copyrightYear}}</p>{{/publication}}")');
 * const result = expr.evaluate();
 *
 * @returns {String|Void} Returns the resulting string, or undefined for undefined value or value for undefined template
 *
 * @see {@link https://www.npmjs.com/package/mustache|Mustache NPM}
 */
const mustache = (value, template) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof template === 'undefined') {
    return value;
  }

  return Mustache.render(template, value);
};

/**
 * Convert UNICODE String to ASCII
 * Converts alphabetic, numeric, and symbolic Unicode characters which are not in the first 127 ASCII characters (the "Basic Latin" Unicode block) into their ASCII equivalents.
 *
 * @access private
 * @param {String} [value=''] The UNICODE string to convert.
 * @param {Object} [options={}] The options object.
 * @param {String} [options.replacement=Void] The string to replace unknown UNICODE characters with, each byte of the UNICODE string is replaced if Void then unknown characters are maintained.
 *
 * @example <caption>Example usage within a JSONata transform</caption>
 * // returns
 * // result = 'Lorem 🤧 eripuit'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$unicodeToASCII("Lörem 🤧 ëripuît")');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform with replacement of Unknown characters</caption>
 * // returns
 * // result = 'Lorem  eripuit'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$unicodeToASCII("Lörem 🤧 ëripuît", { "replacement": ""})');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform with replacement of Unknown characters, most UNICODE characters are 2 bytes long the UTF8 Encoding for this emoji is 0xF0 0x9F 0xA4 0xA7</caption>
 * // returns
 * // result = 'Lorem XX eripuit'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$unicodeToASCII("Lörem 🤧 ëripuît", { "replacement": "X"})');
 * const result = expr.evaluate();
 *
 * @returns {String|Void} Returns the truncated string, or undefined for undefined input
 *
 * @see {@link https://www.npmjs.com/package/fold-to-ascii|fold-to-ascii NPM}
 */
const unicodeToASCII = (value, options) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const defaultOptions = {};
  defaultOptions.replacement = undefined;
  const localOptions = { ...defaultOptions, ...options };

  return localOptions.replacement !== undefined
    ? ASCIIFolder.foldReplacing(value, localOptions.replacement)
    : ASCIIFolder.foldMaintaining(value);
};

/**
 * Truncate the string
 * @access private
 * @param {String} [value=''] The string to truncate.
 * @param {Object} [options={}] The options object.
 * @param {number} [options.length=30] The maximum string length.
 * @param {String} [options.omission='...'] The string to indicate text is omitted.
 * @param {String} [options.wordbreak] The wordbreak strings to truncate to.
 * @param {String} [options.wordbreakregex] The string representation of the regex
 *
 * @example <caption>Example usage within a JSONata transform for length of 13</caption>
 * // returns
 * // result = '1234567890...'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$truncate("1234567890123456789012345678901234567890", {"length": 13, "omission": "..."})');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform for length of 20, and with a list of wordbreaks (these will be trimmed from end if present)</caption>
 * // returns
 * // result = '1234567890123456....'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$truncate('1234567890123456 , 789012345678901234567890', { 'length': 20 , 'omission': '...', 'wordbreakregex': '[\\\\s\\\\.%,:;\\\\?_]'})');
 * const result = expr.evaluate();
 *
 * @example <caption>Example usage within a JSONata transform for length of 20, and with a single wordbreak (this will be trimmed from end if present)</caption>
 * // returns
 * // result = '1234567890123456....'
 * const jsonata = require('jsonata-extended');
 * const expr = jsonata('$truncate('1234567890123456 , 789012345678901234567890', { 'length': 20 , 'omission': '...', 'wordbreak': ' ' })');
 * const result = expr.evaluate();
 *
 * @returns {String|Void} Returns the truncated string, or undefined for undefined input
 *
 */
const truncate = (value, options) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const defaultOptions = {};
  defaultOptions.length = 30;
  defaultOptions.omission = '...';
  defaultOptions.separator = undefined;

  const localOptions = { ...defaultOptions, ...options };

  if (typeof localOptions.length !== 'number') {
    throw new TypeError(
      `Expected a number. Received options.length=${
        localOptions.length
      } Type: ${typeof localOptions.length}`
    );
  }

  if (typeof localOptions.omission !== 'string') {
    throw new TypeError(
      `Expected a string. Received options.omission=${
        localOptions.omission
      } Type: ${typeof localOptions.omission}`
    );
  }

  if (localOptions.wordbreak && typeof localOptions.wordbreak !== 'string') {
    throw new TypeError(
      `Expected a string. Received options.wordbreak=${
        localOptions.wordbreak
      } Type: ${typeof localOptions.wordbreak}`
    );
  }

  if (localOptions.wordbreakregex && typeof localOptions.wordbreakregex !== 'string') {
    throw new TypeError(
      `Expected a string. Received options.wordbreakregex=${
        localOptions.wordbreakregex
      } Type: ${typeof localOptions.wordbreakregex}`
    );
  }

  const unicodeArray = [...value];

  if (unicodeArray.length <= localOptions.length) {
    return value;
  }

  const endslice = localOptions.length - [...localOptions.omission].length;

  let firstSlice = unicodeArray.slice(0, endslice);
  const firstSliceString = firstSlice.join('');

  // To support unicode regexp match replace SurrogatePairs with single character
  const regexSurrogatePair = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;
  const firstSliceStringNormalised = firstSliceString.replace(regexSurrogatePair, '\u200D');

  let lastMatch = -1;

  if (localOptions.wordbreakregex && _.isString(localOptions.wordbreakregex)) {
    try {
      localOptions.separator = new RegExp(localOptions.wordbreakregex, 'gu');
      // Get last match
      let matched;
      do {
        matched = localOptions.separator.exec(firstSliceStringNormalised);
        lastMatch = matched ? matched.index : lastMatch;
      } while (matched);
    } catch (error) {
      throw new Error(`Error Processing workdbreakregex.`);
    }
  }

  if (localOptions.wordbreak && _.isString(localOptions.wordbreak) && lastMatch === -1) {
    localOptions.separator = localOptions.wordbreak;
    lastMatch = firstSlice.lastIndexOf(localOptions.separator);
  }

  // Get last match
  firstSlice = lastMatch !== -1 ? unicodeArray.slice(0, lastMatch) : firstSlice;

  return `${firstSlice.join('')}${localOptions.omission}`;
};

/**
 * Register the functions in this library to the JSONata expression
 * @access private
 * @param {Object} expression - The JSONata Expression Object {@link https://www.npmjs.com/package/jsonata|JSONata NPM}
 *
 * @example <caption>Example usage to add the functions in this library to a JSONata expression object, and utilise them</caption>
 * const jsonata = require('jsonata');
 * const jsonataFunctions = require('jsonata-functions');
 *
 * const expression = jsonata('$htmltotext("<p>Leadership has a dark side; a &#34;leadership shadow&#34; that often creates an unknown; lurking fear.</p>")');
 * jsonataFunctions.registerWithJSONATA(expression);
 * const result = expression.evaluate();
 *
 * @throws {TypeError} expression must be a JSONata expression object
 *
 * @see {@link https://www.npmjs.com/package/jsonata|JSONata NPM}
 */
const registerWithJSONATA = (expression) => {
  if (typeof expression === 'undefined' || typeof expression.registerFunction === 'undefined') {
    throw new TypeError('Invalid JSONata Expression');
  }
  expression.registerFunction(
    'htmltotext',
    (value, options) => htmltotext(value, options),
    '<s?o?:s>'
  );

  expression.registerFunction(
    'shortenUuid',
    (value, basex) => shortenUuid(value, basex),
    '<s?s?:s>'
  );

  expression.registerFunction(
    'unshortenUuid',
    (value, basex) => unshortenUuid(value, basex),
    '<s?s?:s>'
  );

  expression.registerFunction('encodeUuid', (value, basex) => encodeUuid(value, basex), '<s?s?:s>');

  expression.registerFunction('decodeUuid', (value, basex) => decodeUuid(value, basex), '<s?s?:s>');

  expression.registerFunction('truncate', (value, options) => truncate(value, options), '<s?o?:s>');

  expression.registerFunction('languageInfo', (value) => languageInfo(value), '<s?:o>');

  expression.registerFunction('parseUrl', (value) => parseUrl(value), '<s?:o>');

  expression.registerFunction('parsePath', (value) => parsePath(value), '<s?:o>');
  // Bind momentjs - signatures we need to support - from https://momentjs.com/docs/#/parsing/
  // moment(String, String);
  // moment(String, String, String);
  // moment(String, String, Boolean);
  // moment(String, String, String, Boolean);
  // moment(String, String[], String, Boolean);
  // moment(Number);
  // moment(Number[]);
  expression.registerFunction('moment', moment, '<(sna)?(sa)?(sb)?b?:o>');

  // Bind momentjs Duration - signatures we need to support - from https://momentjs.com/docs/#/durations/
  // moment.duration(Number);
  // moment.duration(Number, String);
  // moment.duration(String);
  // moment.duration(Object);
  expression.registerFunction('momentDuration', momentDuration, '<(sno)?s?:o>');

  expression.registerFunction(
    'mustache',
    (value, template) => mustache(value, template),
    '<o?s?:s>'
  );

  expression.registerFunction(
    'unicodeToASCII',
    (value, options) => unicodeToASCII(value, options),
    '<s?o?:s>'
  );
};

module.exports = {
  registerWithJSONATA,
};
