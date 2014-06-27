/* jshint node:true */

// requires
var css = require('css');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('underscore');

// things to do to the html based on the css
var clearParentsOf = [];
var inlineBlocks = [];

// anylize css
var cssStr = fs.readFileSync('src/foo.css', 'utf8');
var obj = css.parse(cssStr);
obj.stylesheet.rules.forEach(function(rule) {
  rule.declarations.forEach(function(declaration) {

    // float
    if (declaration.property === 'float' &&
        declaration.value !== 'none' &&
        declaration.value !== 'inherit') {
      clearParentsOf.push(rule.selectors);
    }

    // inline-block
    if (declaration.property === 'display' &&
        declaration.value === 'inline-block') {
      inlineBlocks.push(rule.selectors);
    }

  });
});
clearParentsOf = _.chain(clearParentsOf)
.flatten()
.uniq()
.value();
inlineBlocks = _.chain(inlineBlocks)
.flatten()
.uniq()
.value();

// copy css
fs.createReadStream('src/foo.css')
.pipe(fs.createWriteStream('dest/foo.css'));
fs.createReadStream('lib.css')
.pipe(fs.createWriteStream('dest/lib.css'));

// parse html
var rawHtml = fs.readFileSync('src/foo.html', 'utf8');
var $ = cheerio.load(rawHtml);

// fix html
clearParentsOf.forEach(function(selector) {
  $(selector).parent().addClass('clear');
});

inlineBlocks.forEach(function(selector) {
  _.each($(selector).parent()[0].children, function(child) {
    if (child.type === 'text' &&
        child.data.match(/\s*/)) {
      $(child).remove();
    }
  });
});

// add link to lib.css
$('head').append('<link rel="stylesheet" href="lib.css">');

// Write modified HTML
fs.writeFileSync('dest/foo.html', $.html());
