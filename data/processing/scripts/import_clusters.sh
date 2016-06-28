#!/bin/bash
appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
dir=`pwd`

cd $appdir
echo "Importing NAICs/Cluster mapping"
#node import.js clusters year="2007" file="$dir/clusters/naics2007_clusters_v2013-1028.csv"
node import.js clusters year="2007" file="$dir/clusters/clusters2014.csv"
echo
