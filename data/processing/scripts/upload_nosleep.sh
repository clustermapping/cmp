#!/bin/bash

host=${1:-"hbsvagrant.local"}
pass=${2:-"hbspass1!"}
user=${3:-"admin"}
searchhost=${4:-$host}
echo $host

echo "Deleting data from solr"
curl "http://$searchhost/solr/collection1/update?stream.body=<delete><query>*:*</query></delete>&commit=true"
echo "logging in"
curl -c /tmp/cookies.txt -X POST -d "name=$user&pass=$pass&form_build_id=form-SBM-9QjK2gDMjDL7YGrsNcTxDmwRyT4V_VrI3jNp_BE&form_id=user_login&op=Log+in" http://$host/user/
echo 
echo "uploading states"
curl -b /tmp/cookies.txt -F "shape=@shapes/State_2010Census_DP1.zip" -F "region=@shapes/states.csv" http://$host/api/region/upload
echo
echo "uploading counties"
curl -b /tmp/cookies.txt -F "shape=@shapes/County_2010Census_DP1.zip" -F "region=@shapes/counties.csv" http://$host/api/region/upload
sleep 60
echo
echo "uploading naics mapping"
curl -b /tmp/cookies.txt -F "year=2007" -F "data=@clusters/naics2007_clusters_v2013-1028.csv" http://$host/api/cluster/meta/upload
echo
sleep 5
echo "Optimizing solr"
curl "http://$searchhost/solr/collection1/update?stream.body=<optimize/>"
#for i in [12]*; do 
for i in `/bin/ls -1rd cbp/[12]*`; do 
  for k in $i/*us.txt; do
    echo "uploading $k"
    curl -b /tmp/cookies.txt -F "year=$i" -F "region_type=country" -F "data=@$k" http://$host/api/cluster/upload
    echo 
 done 
 for k in $i/*st.txt; do
    echo "uploading $k"
    curl -b /tmp/cookies.txt -F "year=$i" -F "region_type=state" -F "data=@$k" http://$host/api/cluster/upload
    echo 
 done 
 for k in $i/*co.txt; do
    echo "uploading $k"
    curl -b /tmp/cookies.txt -F "year=$i" -F "region_type=county" -F "data=@$k" http://$host/api/cluster/upload
    echo 
    sleep 60
 done 
done
