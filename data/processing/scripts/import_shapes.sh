#!/bin/bash

appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
dir=`pwd`

./download.sh State_2010Census_DP1.zip shapes $dir
cd $appdir
echo "Importing states"
node import.js regions shape="$dir/shapes/State_2010Census_DP1.zip" meta="$dir/shapes/states.csv"
echo
./download.sh County_2010Census_DP1.zip shapes $dir
echo "Importing counties"
node import.js regions shape="$dir/shapes/County_2010Census_DP1.zip" meta="$dir/shapes/counties.csv"
