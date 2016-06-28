#!/bin/bash
appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
dir=`pwd`

cd $appdir
echo "Importing IBRC Data"
node --max-old-space-size=8192 import.js ibrc metaFile="$dir/ibrc/metaData.csv" stateFile="$dir/ibrc/state_data.csv" countyFile="$dir/ibrc/county_data.csv"
echo
