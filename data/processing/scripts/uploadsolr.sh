#!/bin/bash
dir=${1}
searchhost=${2:-"hbsvagrant.local"}
port=${3:-"8080"}
core=${4:-"collection1"}

if [ -f $dir ]; then
    file=$dir
    echo "Uploading $file to solr"
    zcat $file | curl "http://$searchhost:$port/solr/$core/update?commit=true" -o /tmp/curloutput --progress-bar --data-binary @- -H 'Content-type:application/json'
    cat /tmp/curloutput
    rm /tmp/curloutput
else
    mkdir -p $dir/uploaded
    for file in `ls -1r $dir/*.json.gz`; do
        echo "Uploading $file to solr"
        zcat $file | curl "http://$searchhost:$port/solr/$core/update?commit=true" -o /tmp/curloutput --progress-bar --data-binary @- -H 'Content-type:application/json'
        cat /tmp/curloutput
        rm /tmp/curloutput
	mv $file $dir/uploaded
    done
    ./optimize.sh $searchhost $port $core
fi
