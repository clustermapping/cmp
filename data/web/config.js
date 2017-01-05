module.exports = {
  development: {
    solr: {
      host: '54.83.55.22',
      port: 80,
      core: 'clusterdata',
      path: '/solr'
    },
    port: 4001,
    base:'/data',
    baseUrl: 'hbsvagrant.local'
  },
  test: {
    solr: {
      host: 'hbsvagrant.local',
      port: 80,
      core: 'collection1',
      path: '/solr'
    },
    port: 4001,
    base: '/data',
    baseUrl: 'hbsvagrant.local'
  },
  stage: {
    solr: {
      host: '54.235.148.104',
      port: 80,
      core: 'clusterdata',
      path: '/solr'
    },
    siteSolr: {
      host: '54.235.148.104',
      port: 80,
      core: 'sitesearch',
      path: '/solr'
    },
    port: 4001,
    base: '/data',
    baseUrl: '54.83.55.22'
  },
  production: {
    solr: {
      host: '54.83.55.150',
      port: 80,
      core: 'clusterdata2016',
      path: '/solr'
    },
    siteSolr: {
      host: '54.83.55.150',
      port: 80,
      core: 'collection1',
      path: '/solr'
    },
    port: 4001,
    base: '/data',
    baseUrl: '54.83.53.228'
  }
};
