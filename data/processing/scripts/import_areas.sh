#!/bin/bash

appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
dir=`pwd`

$dir/download.sh eas.csv areas $dir
cd $appdir
echo "Importing EAs"
node import.js areas region_type="economic" file="$dir/areas/eas.csv"
echo 

$dir/download.sh msas.csv areas $dir
echo "Importing MSAs"
node import.js areas region_type="msa" file="$dir/areas/msas.csv"
echo 
