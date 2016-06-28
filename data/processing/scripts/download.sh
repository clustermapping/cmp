#!/bin/bash
file=${1}
folder=${2:-"."}
dir=${3:-"."}

if [ ! -f $dir/$folder/$file ]; then
	echo "do download"
else
	echo "don't download"
fi