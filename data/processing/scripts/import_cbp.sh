#!/bin/bash
appdir=${1:-"/opt/development/hbs/clustermapping/data/processing"}
year=${2:-"2011"}
dir=`pwd`
i=$dir/cbp/$year

cd $appdir
./download.sh eas.csv areas $dir
for k in $i/*us.txt; do
	echo "Importing US Data: $k"
	node import.js cbp year="$year" region_type="country" file="$k"
	echo 
done 

for k in $i/*st.txt; do
	echo "Importing State Data: $k"
	node import.js cbp year="$year" region_type="state" file="$k"
	echo 
done 

for k in $i/*co.txt; do
	echo "Importing County Data: $k"
	node import.js cbp year="$year" region_type="county" file="$k"
	echo 
done
 
