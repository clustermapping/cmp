require.config({
  baseUrl: "../src",
  paths: {
    'd3': '../bower_components/d3/d3.min',
    'topojson': '../bower_components/topojson/topojson',
    'queue': '../bower_components/queue-async/queue.min',
  },
  shim: {
    'd3': {
      exports: 'd3'
    },
    'topojson': {
      exports: 'topojson'
    },
    'queue': {
      exports: 'queue'
    }
  }
});

require(['d3','topojson', 'queue']);
