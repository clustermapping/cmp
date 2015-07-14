# simple-json2csv

A simple json to csv converter nodejs module

[![build status](https://secure.travis-ci.org/unvar/simple-json2csv.png)](http://travis-ci.org/unvar/simple-json2csv)

## Installation

This module is installed via npm:

``` bash
$ npm install simple-json2csv
```

It exposes a SimpleJson2Csv class with a constructor that accepts a single parameter with following properties.

```
data: the array of objects to be converted [{}...]
fields: array of field objects or simple strings [{ name: 'blah', header: 'Blah Header' }...] 
        header property is optional in which case name property or string will be use for column name
transform: the function which will be called on each object function(obj) { return transformed; }
 ```

## Example Usage

``` js
var SimpleJson2Csv = require('simple-json2csv');

// create a new instance
var json2Csv = new SimpleJson2Csv({
  fields: [ 
    { name: "name", header: "Name" },
    { name: "email", header: "Email Address" }
  ],
  data: [
    { name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }
  ]
});
json2Csv.pipe(fs.createWriteStream('/path/to/some/file'));

// hint: listen for 'close' on the writable file stream
```
