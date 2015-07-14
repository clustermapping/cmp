"use strict";
// polyfills
require('./polyfills.js');
require('date-utils');

var Readable = require('stream').Readable || require('readable-stream'),
    util = require('util'),
    os = require('os'),
    _ = require('underscore');



// constants
var DATE_FORMAT = 'MMM-DD-YYYY';

/**
 * Creates a new Json2Csv instance.
 * @constructor
 * @param {object} options - the configuration needed by the Json2Csv
 *                           data: the array of objects to be converted [{}...]
 *                           fields: array of field objects [{ name: 'blah', header: 'Blah Header' }...]
 *                           transform: the function which will be called on each object function(obj) { return transformed; }
 */ 
function Json2Csv(options) {
  // has this been newed?
  if (!(this instanceof Json2Csv)) {
    return new Json2Csv(options);
  }
  
  Readable.call(this);
  
  // some private state
  this._header = true;
  this._maxRows = 1000;
  this._sent = 0;
  
  // some sensible defaults
  this._data = options.data || options || [];
  this._fields = options.fields || [];
  this._transform = typeof(options.transform) === 'function' && options.transform;
  
  // enrich the fields
  this._fields = this._fields.map(function(field) {
    return _.isString(field) ? { name: field } : field;
  });
}
util.inherits(Json2Csv, Readable);

Json2Csv.prototype._read = function() {
  // check if header is out
  if (this._header) {
    this._sendHeader();
  }
  
  // send data row by row  
  while(this._data.length){ // && !this._sent > this._maxRows) {
    if (!this._sendRow(this._data.shift())) {
      // need to stop if cannot push anymore
      break;
    }
  }
  
  // are we done
  if (!this._data.length) {
    this.push(null);
  }
};

Json2Csv.prototype._sendHeader = function() {
  var headers = this._fields.map(function(field) {
    return '"' + (field.header || field.name.toTitleCase()) + '"';
  });
  
  var ret = this._sendData(headers);
  this._header = false;
  
  return ret;
};

Json2Csv.prototype._sendRow = function(row) {
  if (this._transform) {
    row = this._transform(row);
  }
  
  var data = [];
  var self = this;
  this._fields.forEach(function(field) {
    data.push(self._format(row[field.name]));
  });
  
  return this._sendData(data);
};

Json2Csv.prototype._sendData = function(data) {
  var ret = this.push(data.join(',') + os.EOL);
  
  // keep a count of lines written
  this._sent++;
  return ret;  
};

Json2Csv.prototype._format = function(item) {
  if (_.isFunction(item)) {
    return this._format(item.call(null));
  } else if (_.isDate(item)) {
    return '"' + item.toFormat(DATE_FORMAT) + '"';
  } else if (_.isNumber(item)) {
    return item;
  } else if (!item) {
    return '""';
  } else {
    return '"' + item + '"';
  }
};

module.exports = Json2Csv;
