#!/bin/bash
appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
year=${2:-"2011"}
regions=${3:-"country state economic msa county"}
dir=`pwd`
cd $appdir

for region in $regions; do
	echo "Processing Data: $region $year"
	node --max-old-space-size=8192 import.js process year="$year" region_type="$region"
	echo 
done 
