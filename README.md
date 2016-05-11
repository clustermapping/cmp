# Cluster Mapping Project

## Simplified build

### Software required
* NodeJS
    * npm
    * nodemon

### Build and run API Browser

    git clone https://github.com/clustermapping/cmp.git
    cd cmp/data/web
    npm install
    nodemon server


## Full platform build

### Software required
* Nginx
* PHP /
    * php-fpm
    * php-gd
* MySQL
* NodeJS
    * npm
    * nodemon
* Solr
* Git
* Drush
* Memcached

## Clone the GitHub repository 
Repository root: https://github.com/clustermapping/cmp

    mkdir /opt/development
    cd /opt/development
    git clone https://github.com/clustermapping/cmp.git

## Configure Nginx
    cp /opt/development/cmp/environment/nginx/conf.d/* /etc/nginx/conf.d/

## Set up Solr
Download solr data file:

    wget http://54.83.55.22/sites/default/files/cmp-solr-dataset-latest.tgz

## Install data API dependencies
    cd /opt/development/cmp/data/web ; npm install
    cd /opt/development/cmp/data/processing ; npm install

### Data API Configuration options
Configuration options can be found at /opt/development/cmp/data/web/config.js

## Start data API
    cd /opt/development/cmp/data/web ; nodemon server.js
Point the browser to http://localhost:4001/ to verify the API connection.

## Build Drupal CMS
    cd /opt/development/cmp/cms
    ./build.sh html
Make sure the settings file is writable for the web server.

## Rebuilding a development environment
To rebuild an existing environment, simply running the cmp/cms/build.sh html command will rebuild the target docroot. It will do this by blowing it away the existing docroot directory (but not the repo, settings.php, or the files directory). Once it's rebuilt, it will run a series of drush commands, such as 'cc all', 'fra', and 'updb' to make sure the existing database is caught back up.

### CMS Configuration options
Configuration options can be found at /opt/development/cmp/cms/settings.php

## Configure PHP-FPM
Make sure PHP-FPM is listening on 127.0.0.1 port 9000.
Example: /etc/php5/fpm/pool.d/www.conf

    listen = 127.0.0.1:9000

## Drupal installation
Point the browser to http://hbsvagrant.local/ and follow the install instructions.
