# Cluster Mapping Project

## Software required
* Nginx
* PHP /
    * php-fpm
    * php-gd
* MySQL
* NodeJS
    * npm
    * nodemon
* Solr
* Tomcat
* git
* drush
* memcached

## Clone the GitHub repository https://github.com/clustermapping/cmp

mkdir /opt/development
cd /opt/development
git clone https://github.com/clustermapping/cmp.git

## Configure Nginx
    cp /opt/development/cmp/environment/nginx/conf.d/* /etc/nginx/conf.d/

## Set up Solr:
    * Download solr data file:
    wget http://54.83.55.22/sites/default/files/cmp-solr-dataset-latest.tgz

## Set up data api:
    cd /opt/development/cmp/data/web ; npm install
    cd /opt/development/cmp/data/processing ; npm install

## Start data api:
    cd /opt/development/cmp/data/web ; nodemon -g server.js

## Build CMS 
    cd /opt/development/cmp/cms
    ./build.sh html

Make sure the settings file is writable for the web server.


## Configure PHP-FPM
    Make sure PHP-FPM is listening on 127.0.0.1 port 9000
    Example: /etc/php5/fpm/pool.d/www.conf
        listen = 127.0.0.1:9000

## Drupal installation
    Point the browser to http://hbsvagrant.local/ and follow the install instructions.