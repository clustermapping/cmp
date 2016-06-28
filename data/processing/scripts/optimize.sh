#!/bin/bash
searchhost=${1:-"hbsvagrant.local"}
port=${2:-"8080"}
core=${3:-"collection1"}

echo "Optimizing solr"
curl "http://$searchhost:$port/solr/$core/update?wt=json&stream.body=<optimize/>"
