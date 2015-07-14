#!/bin/sh
#
# ---USAGE---
# This script is to be used in the root directory of your site, where html will
# be created. Example usage: /opt/development/person: hbs/clustermapping/cms/build.sh html
#
# This will create a drupal installation in the html folder. If you use a name
# that isn't html, a symlink will be created for you.
#
# You can either create your own settings.php/files directory in the root directory
# before running the script, and have them symlinked by the script, or the script
# will create and symlink them for you.

set -e

if [ $# -eq 0 ]; then
  echo "Usage $0 target_build_dir"
  exit 1
fi
DRUSH_OPTS='--working-copy --no-gitinfofile'
MAKEFILE='clustermapping.make'
TARGET=$1

# Make sure we have a target directory
if [ -z "$TARGET" ]; then
  echo "Usage $0 target_build_dir"
  exit 2
fi
CALLPATH=`dirname $0`
ABS_CALLPATH=`cd $CALLPATH; pwd -P`
BASE_PATH=`cd ..; pwd`

if [ -e html_tmp ]; then 
  rm -rf html_tmp
  echo Removing existing tmp directory
fi

drush make $DRUSH_OPTS $ABS_CALLPATH/$MAKEFILE html_tmp

echo -------------------------------------

echo Build target: html_tmp


if [ ! -e html_tmp/profiles/clustermapping ]; then
  ln -s $ABS_CALLPATH html_tmp/profiles/clustermapping
fi

cd html_tmp/sites/default
if [ -e ../../../settings.php ] && [ ! -e settings.php ]; then
  ln -s ../../../settings.php .
  echo settings.php symlinked
elif [ ! -e ../../../settings.php ]; then
  cp default.settings.php ../../../settings.php
  chmod 666 ../../../settings.php
  ln -s ../../../settings.php .
  echo default.settings.php copied and moved to root directory as settings.php. Fill in database connection info.
else
  echo Settings.php file was already present.
fi


if [ -e /opt/files ] && [ ! -e files]; then
  ln -s /opt/files .
  echo Files directory symlinked
elif [ ! -e ../../../files ]; then
  mkdir ../../../files
  chmod 777 ../../../files
  ln -s ../../../files .
  echo Files directory created in root directory and symlinked.
elif [ -e ../../../files ] && [ ! -e files ]; then
  echo Files directory symlinked
  ln -s ../../../files .
else
  echo Files directory was already present.
fi


if [ -e /opt/files-private ]; then
  ln -s /opt/files-private .
  echo Private Files directory symlinked
elif [ ! -e ../../../files-private ]; then
  mkdir ../../../files-private
  chmod 777 ../../../files-private
  ln -s ../../../files-private .
  echo Private Files directory created in root directory and symlinked.
elif [ -e ../../../files-private ] && [ ! -e files-private ]; then
  echo Private Files directory symlinked
  ln -s ../../../files-private .
else
  echo Private files directory was already present.
fi

cd ../all/libraries
if [ -e /opt/development/mythos-vis ]; then
  ln -s /opt/development/mythos-vis .
  echo "mythos-vis symlinked"
elif [ -e ../../mythos-vis ]; then
  ln -s ../../mythos-vis .
  echo "mythos-vis symlinked"
else
  echo "could not link mythos-vis"
fi


cd ../../../../files

if [ -e ../timeline ] && [ ! -e timeline ]; then
  ln -s ../timeline .
  echo timeline symlinked to Files directory
elif [ -e timeline ]; then
  echo Timeline directory already exist.
else
  echo No timeline directory was present.
fi



# Get back to docroot and run drush to clear cache and run updates
cd ../html_tmp

# If the database exists, clear "stuff"
if [ -z "`drush sqlq 'show tables like "system"'`" ]; then
  drush cc drush
else
  drush cc all
  drush updb --yes
  drush cc drush
  drush fra --yes
  drush cc all
fi

cd ..

# remove any existing html_old
if [ -e html_old ]; then
  rm -rf html_old
  echo Remove existing html_old
fi

# rename existing html to html_old
if [ -e html ]; then
  mv html html_old
fi

# remove any existing dir with the same name as $TARGET
if [ -e $TARGET ]; then
  rm -rf $TARGET
  echo Removing existing target directory
fi

# rename html_tmp dir to $TARGET
mv html_tmp $TARGET

if [ ! -e html ]; then
  ln -s $TARGET html
  echo Symlinked html to $TARGET
fi