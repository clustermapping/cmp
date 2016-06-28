api = 2
core = 7.x

;***************;
;* Drupal core *;
;***************;

projects[drupal][type] = core
projects[drupal][version] = 7.38
projects[drupal][patch][1899498] = http://drupal.org/files/field_guarantee_hook_field_presave.patch


;*******************;
;* Contrib modules *;
;*******************;

; Addres Field
projects[addressfield][subdir] = contrib
projects[addressfield][version] = 1.1

; Apache Solr
projects[apachesolr][subdir] = contrib
projects[apachesolr][version] = 1.7

; Breakpoints
projects[breakpoints][subdir] = contrib
projects[breakpoints][version] = 1.3

; Captcha
projects[captcha][subdir] = contrib
projects[captcha][version] = 1.3

; Chosen
projects[chosen][subdir] = contrib
projects[chosen][version] = 2.0-beta4

; CKEditor
projects[ckeditor][subdir] = contrib
projects[ckeditor][version] = 1.16

; Corresponding Node References
projects[cnr][subdir] = contrib
projects[cnr][version] = 4.22

; Ctools
projects[ctools][subdir] = contrib
projects[ctools][version] = 1.7
;projects[ctools][patch][1828534] = http://drupal.org/files/ctools-n1828534-5.patch

; Date
projects[date][subdir] = contrib
projects[date][version] = 2.8

; Entity
projects[entity][subdir] = contrib
projects[entity][version] = 1.6

; Features
projects[features][subdir] = contrib
projects[features][version] = 2.5

; Field collection
projects[field_collection][subdir] = contrib
projects[field_collection][version] = 1.0-beta5

; Field group
projects[field_group][subdir] = contrib
projects[field_group][version] = 1.4

; Filter Perms
projects[filter_perms][subdir] = contrib
projects[filter_perms][version] = 1.0

; Geocoder
projects[geocoder][subdir] = contrib
projects[geocoder][version] = 1.2

; Geolocation Field
projects[geolocation][subdir] = contrib
projects[geolocation][version] = 1.6

; Geophp
projects[geophp][subdir] = contrib
projects[geophp][version] = 1.7

; Google Analytics
projects[google_analytics][subdir] = contrib
projects[google_analytics][version] = 1.4

; IMCE
projects[imce][subdir] = contrib
projects[imce][version] = 1.9

; jQuery Update
projects[jquery_update][subdir] = contrib
projects[jquery_update][version] = 2.6

; Libraries
projects[libraries][subdir] = contrib
projects[libraries][version] = 2.2

; Memcache
projects[memcache][subdir] = contrib
projects[memcache][version] = 1.5

; Metatag
projects[metatag][subdir] = contrib
projects[metatag][version] = 1.4

; Metatags quick
projects[metatags_quick][subdir] = contrib
projects[metatags_quick][version] = 2.9

; Navbar
projects[navbar][subdir] = contrib
projects[navbar][type] = module
projects[navbar][download][type] = git
projects[navbar][download][url] = http://git.drupal.org/project/navbar.git
projects[navbar][download][branch] = 7.x-1.x
projects[navbar][download][revision] = 9e9bb37

; Pathauto
projects[pathauto][subdir] = contrib
projects[pathauto][version] = 1.2
projects[pathauto][patch][936222] = http://drupal.org/files/pathauto-persist-936222-130-pathauto-state.patch

; Pathauto persistent state
projects[pathauto_persist][subdir] = contrib
projects[pathauto_persist][version] = 1.3

; Phone Field
projects[phone][subdir] = contrib
projects[phone][download][type] = git
projects[phone][download][url] = http://git.drupal.org/project/phone.git
projects[phone][download][revision] = 4b02be4


; reCaptcha
projects[recaptcha][subdir] = contrib
projects[recaptcha][version] = 1.11

; References
projects[references][subdir] = contrib
projects[references][version] = 2.1
projects[references_dialog][subdir] = contrib
projects[references_dialog][download][type] = git
projects[references_dialog][download][url] = http://git.drupal.org/project/references_dialog.git
projects[references_dialog][download][revision] = faf64b7
projects[references][patch][1599132] = http://drupal.org/files/error_on_saving_node-1599132-4.patch

; Robots TXT
projects[robotstxt][subdir] = contrib
projects[robotstxt][version] = 1.3

; SMTP
projects[smtp][subdir] = contrib
projects[smtp][version] = 1.2

; Strongarm
projects[strongarm][subdir] = contrib
projects[strongarm][version] = 2.0

; Token
projects[token][subdir] = contrib
projects[token][version] = 1.6

; URL
projects[url][subdir] = contrib
projects[url][version] = 1.0

; Views
projects[views][subdir] = contrib
projects[views][version] = 3.11
projects[views][patch][1959558] = http://drupal.org/files/fixed_image_warnings-1959558-1.patch

; Views Autocomplete Filters
projects[views_autocomplete_filters][subdir] = contrib
projects[views_autocomplete_filters][version] = 1.2

; Views Bulk Operations
projects[views_bulk_operations][subdir] = contrib
projects[views_bulk_operations][version] = 3.2

; Views data export
projects[views_data_export][subdir] = contrib
projects[views_data_export][version] = 3.0-beta8

; Workbench
projects[workbench][subdir] = contrib
projects[workbench][version] = 1.2

; Workbench Moderation
projects[workbench_moderation][subdir] = contrib
projects[workbench_moderation][version] = 1.4
projects[workbench_moderation][patch][1942314] = http://drupal.org/files/workbench_moderation-set_moderation_set_none_by_variable-1942314-1.patch

; XML Sitemap
projects[xmlsitemap][subdir] = contrib
projects[xmlsitemap][version] = 2.2


;*********************;
;* Developer modules *;
;*********************;

; Devel
projects[devel][subdir] = contrib
projects[devel][version] = 1.5

; Diff
projects[diff][subdir] = contrib
projects[diff][version] = 3.2


;*********;
;* Theme *;
;*********;

;projects[bootstrap][type] = theme
;projects[bootstrap][download][type] = git
;projects[bootstrap][download][url] = http://git.drupal.org/project/bootstrap.git
;projects[bootstrap][download][branch] = 7.x-3.x
projects[bootstrap][type] = theme
projects[bootstrap][version] = 3.0

projects[ember][type] = theme
projects[ember][version] = 2.0-alpha2


;*************;
;* Libraries *;
;*************;

; Backbone
libraries[backbone][directory_name] = backbone
libraries[backbone][download][type] = get
libraries[backbone][download][url] = https://github.com/documentcloud/backbone/archive/master.zip

; Chosen
libraries[chosen][download][type] = "get"
libraries[chosen][download][url] = "https://github.com/harvesthq/chosen/releases/download/1.0.0/chosen_v1.0.0.zip"
libraries[chosen][directory_name] = "chosen"
libraries[chosen][destination] = "libraries"

; CKEditor
libraries[ckeditor][download][type] = get
libraries[ckeditor][download][url] = http://download.cksource.com/CKEditor/CKEditor/CKEditor%204.1.1/ckeditor_4.1.1_full.tar.gz
libraries[ckeditor][destination] = libraries

; D3
libraries[d3][download][type] = get
libraries[d3][download][url] = https://github.com/mbostock/d3/archive/master.zip
libraries[d3][destination] = libraries

; Phone Numbers
libraries[libphonenumber][download][type] = "get"
libraries[libphonenumber][download][url] = "https://github.com/chipperstudios/libphonenumber-for-php/archive/master.zip"
libraries[libphonenumber][directory_name] = "libphonenumber-for-php"
libraries[libphonenumber][destination] = "libraries"

; Queue
libraries[queue][download][type] = get
libraries[queue][download][url] = https://github.com/mbostock/queue/archive/master.zip
libraries[queue][destination] = libraries

; TopoJSON
libraries[topojson][download][type] = get
libraries[topojson][download][url] = https://github.com/mbostock/topojson/archive/master.zip
libraries[topojson][destination] = libraries

; Underscore
libraries[underscore][directory_name] = underscore
libraries[underscore][download][type] = get
libraries[underscore][download][url] = https://github.com/documentcloud/underscore/archive/master.zip

; LeafletJS
libraries[leaflet][directory_name] = leaflet
libraries[leaflet][download][type] = get
libraries[leaflet][download][url] = https://github.com/Leaflet/Leaflet/archive/v0.7.3.zip

; MythosVis
;libraries[mythosvis][directory_name] = mythos
;libraries[mythosvis][download][type] = git
;libraries[mythosvis][download][url] = git@bitbucket.org:phase2tech/mythos-vis.git
;libraries[mythosvis][download][branch] = master
