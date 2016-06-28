#!/bin/bash
query=${1:-"all"}
searchhost=${2:-"hbsvagrant.local"}


if [ $query == "all" ]; then
	query='*:*'
else
	query="type_t:$query"
fi

echo "Deleting data from solr"
curl "http://$searchhost:8080/solr/collection1/update?stream.body=<delete><query>$query</query></delete>&commit=true"
echo "Optimizing solr"
curl "http://$searchhost:8080/solr/collection1/update?stream.body=<optimize/>"

