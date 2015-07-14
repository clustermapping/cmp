function create_importer() {
  var keyName = function (str) {
    return str.replace(/[\(\)\*&,'":;\/\.]/g, '') // remove bad chars
              .replace(/\$?000/,'') // remove scaling info
              .trim() // remove initial spaces
              .replace(/[\- ]/g, '_') // remove spaces and dashes -> underscore
              .replace(/([a-z0-9])([A-Z])/g, '$1_$2') //camel case -> snake case
              .replace(/__+/, '_') // multiple underscores get collapsed
              .replace(/_$/,'') // remove trailing underscores
              .toLowerCase(); // to lower case
  };

  return {
    filter: function(row) {
      return row.VariableID !== '';
    },
    transform: function(row) {
      return {
        id: row.VariableID,
        name: row.Variable,
        key: keyName(row.Variable),
        scaling: row.Scaling
      }
    }
  }
}

module.exports = create_importer;