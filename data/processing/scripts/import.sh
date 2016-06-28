#!/bin/bash

appdir=${1:-"/opt/development/hbs/clustermapping/dataservices"}
searchhost=${2:-"hbsvagrant.local"}
dir=`pwd`
regions="country state economic msa county"

#./delete.sh all $searchhost
#./import_shapes.sh $appdir
#./import_clusters.sh $appdir
#./import_areas.sh $appdir
#./optimize.sh $searchhost

#for year in `seq 2011 -1 1998`;  do
#    ./import_cbp.sh $appdir $year 
#done

for r in $regions; do
	for year in `seq 1999 -1 1998`; do
	    ./import_process.sh $appdir $year $r
	    ./optimize.sh $searchhost
	done
done

./import_ibrc.sh $appdir
