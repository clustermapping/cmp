"use strict";
var expect = require('expect.js'),
    SimpleJson2Csv = require('..'),
    fs = require('fs'),
    path = require('path');

describe('simple-json2csv', function() {
  beforeEach(function(done) {
    this.options = JSON.parse(JSON.stringify(require('./fixtures/simple.json')));
    done();
  });

  it('should print csv for simple strings', function(done) {
    var json2Csv = new SimpleJson2Csv(this.options);    
    collect(json2Csv, function(csv) {
      expect(csv).to.equal(fs.readFileSync(path.join(__dirname, './fixtures/simple.csv')).toString());
      done();
    });
  });

  it('should apply transformation and print csv', function(done) {
    // setup
    this.options.transform = function(row) {
      row.email = row.email.replace('domain','google');      
      return row;
    };
    
    // test
    var json2Csv = new SimpleJson2Csv(this.options);
    collect(json2Csv, function(csv) {
      // verify
      expect(csv).to.equal(fs.readFileSync(path.join(__dirname, './fixtures/simpleTransform.csv')).toString());
      done();
    });
  });

  it('should apply formatting and print csv', function(done) {
    // setup
    this.options.fields.push({ name: 'dob', header: 'Birthday'});
    this.options.data.map(function(row) {
      row.dob = new Date(Date.parse('Oct-08-1956', 'MMM-dd-yyyy'));
      return row;
    });
    
    // test
    var json2Csv = new SimpleJson2Csv(this.options);
    collect(json2Csv, function(csv) {
      // verify
      expect(csv).to.equal(fs.readFileSync(path.join(__dirname, './fixtures/simpleWithDates.csv')).toString());
      done();
    });
  });

  it('should output csv to a file', function(done) {
    // setup
    // XXX: all sync methods so test is faster. not advisable in actual code
    var outCsv = path.join(__dirname, './fixtures/output.csv');
    if (fs.existsSync(outCsv)) {
      fs.unlinkSync(outCsv);
    }
    
    // test
    var json2Csv = new SimpleJson2Csv(this.options);
    var out = fs.createWriteStream(outCsv);
    out.on('close', function() {
      // verify
      expect(fs.readFileSync(outCsv).toString())
        .to.equal(fs.readFileSync(path.join(__dirname, './fixtures/simple.csv')).toString());
      
      if (fs.existsSync(outCsv)) {
        fs.unlinkSync(outCsv);
      }
      done();
    });
    
    // the actual magic
    json2Csv.pipe(out);
  });
  
  it('should handle string fields', function(done) {
    // setup
    this.options.fields = [ 'name', 'email'];
    
    // test
    var json2Csv = new SimpleJson2Csv(this.options);    
    collect(json2Csv, function(csv) {
      // verify
      expect(csv).to.equal(fs.readFileSync(path.join(__dirname, './fixtures/simpleNoHeaders.csv')).toString());
      done();
    });
  });

});

/**
 * Simple collector to collect a readable stream into a string
 */
function collect(readable, cb) {
  var data = '';
  readable.on('data', function(chunk) {
    data += chunk;
  });
  readable.on('end', function() {
    cb(data);
  });
}
