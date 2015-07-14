<?php

/**
 * Implements hook_drush_command().
 */
function hbs_content_drush_command() {
  $items = array();

  $items['hbs_content'] = array(
    'description' => "Installs default content for Clustermapping.us",
    'arguments' => array(
      'type' => 'The optional type of content to install (nodes, terms).',
    ),
    'examples' => array(
      'drush hbs_content' => 'This will install all default content, updating any previously instaled content.',
      'drush hbs_content type' => 'This will install/update default content of the given type.',
    ),
    'aliases' => array('hbscontent'),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
    'callback' => 'drush_hbs_content_install_content',
  );

  $items['hbs_orgs_and_clusters'] = array(
    'description' => "Imports a CSV file containing organizations and clusters",
    'arguments' => array(
      'filename' => 'The name CSV file.',
    ),
    'examples' => array(
      'drush hbs_orgs_and_clusters /path/to/filename.csv' => 'This will read the CSV file and updated the organiztions listed there with the appropriate clusters.',
    ),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
    'callback' => 'drush_hbs_content_hbs_orgs_and_clusters',
  );

  $items['hbs_orgs_and_regions'] = array(
    'description' => "Updates regions based on address",
    'examples' => array(
      'drush hbs_orgs_and_regions' => 'Updates the regions (states only) for existing orgnaizations based on address field data',
    ),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
    'callback' => 'drush_hbs_content_hbs_orgs_and_regions',
  );

  $items['hbs_orgs_reversegeo'] = array(
    'description' => "Updates organizations by adding state via reverse geolocation",
    'examples' => array(
      'drush hbs_orgs_reversegeo' => 'Updates organizations by adding state via reverse geolocation orgnaizations based on address field data',
    ),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
    'callback' => 'drush_hbs_content_hbs_orgs_reversegeo',
  );

  return $items;
}

/**
 * Drush command callback for the 'hbs_content' command.
 */
function drush_hbs_content_install_content($type = NULL) {
  $installed_content = variable_get('hbs_content_installed_content', array());
  $vid = NULL;

  $types = array('terms', 'nodes');
  if ($type) {
    $types = array($type);
  }
  foreach ($types as $item_type) {
    if (empty($installed_content[$item_type])) {
      $installed_content[$item_type] = array();
    }

    $files = scandir(__DIR__ . '/' . $item_type . '/');

    foreach ($files as $file) {
      if (strpos($file, '.inc') !== FALSE) {
        // Get the contents of each item from its file and decode it into a usable PHP array/object.
        include_once __DIR__ . '/' . $item_type . '/' . $file;
        $content = json_decode($content);

        // Loop through this item, even though there's only one, so that we can use the array index as the unique machine name.
        foreach ($content as $machine_name => $item) {
          switch ($item_type) {
            case 'terms':
              _hbs_content_process_terms($machine_name, $item, $vid, $installed_content);
              drush_print(' * Installed the taxonomy term ' . $item->name);
              break;

            case 'nodes':
              _hbs_content_process_nodes($machine_name, $item, $installed_content);
              drush_print(' * Installed the node ' . $item->title);
              break;

            default:
              # code...
              break;
          }
        }
      }
    }
  }

  drush_print("\n*** You may need to run 'drush cc menu' to pick up any path alias changes.\n");

  variable_set('hbs_content_installed_content', $installed_content);
}

function _hbs_content_process_nodes($machine_name, $item, &$installed_content) {
  // Check our manifest ('hbs_content_installed_content') for this term's machine name. If it's not found, disregard
  // the term ID from the import data since it won't apply to this instance (that TID is export cruft).
  if (empty($installed_content['nodes'][$machine_name])) {
    unset($item->nid);
  }
  else {
    // If the TID exists in the 'hbs_content_installed_content' manifest, change the item object's TID to that ID value.
    $item->nid = $installed_content['nodes'][$machine_name];
  }

  // Unset unwanted export cruft.
  unset($item->vid);

  $term = NULL;

  // Since the TIDs from the exported data is invalid and won't match up with the current CMS's term data,
  // we'll need to examine our makeshift lookup table when we installed Section vocabulary term data. (this
  // is why the terms have to be installed first).
  if(!empty($item->field_section)) {
    $tid_lookup = variable_get('hbs_content_old_tids', array());
    foreach ($item->field_section->{LANGUAGE_NONE} as &$section_data) {
      $section_data->tid = $tid_lookup[$section_data->tid];
      $term = taxonomy_term_load($section_data->tid);
    }
  }

  // Convert all the fields from objects to arrays; for some reason, the export process is converting some array
  // elements into stdClass objects, which breaks Field API.
  foreach ($item as $key => $field) {
    $item->{$key} = _hbs_content_object_to_array($field);
  }

  // Save the node object.
  node_save($item);

  if ($item->title == 'Learn') {
    variable_set('hbs_content_learn_nid', $item->nid);
    
    db_delete('url_alias')
      ->condition('alias', 'learn')
      ->execute();

    db_update('menu_links')
      ->fields(array(
        'link_path' => 'node/' . $item->nid,
      ))
      ->condition('link_title', 'Learn')
      ->condition('menu_name', 'main-menu')
      ->execute();
  }

  // Set the path alias for these nodes; that data is not currently exported, even thought the pathauto boolean value is.
  $path = array(
    'source' => 'node/' . $item->nid,
    'alias' => ( !is_null($term)? _hbs_content_machine_name($term->name, TRUE) . '/' : '' ) . _hbs_content_machine_name($item->title, TRUE),
  );
  path_save($path);

  // Mark this one in our master list as installed.
  $installed_content['nodes'][$machine_name] = $item->nid;
}

/**
 * Function to process taxonomy terms to be installed.
 */
function _hbs_content_process_terms($machine_name, $item, &$vid, &$installed_content) {
  // If we haven't picked a vocabulary yet, we need to determine which VID will be used to add this term to the appropriate vocabulary.
  // It's very possible the VID will be different, so we'll rely solely on the vocabulary machine name. That's handled by Features,
  // so we'll assume that the vocabulary already exists and we're only installing taxonomy terms.
  if (empty($vid)) {
    $vocabulary = taxonomy_vocabulary_machine_name_load($item->vocabulary_machine_name);
    $vid = $vocabulary->vid;
  }

  // Hold on to the old TID for later...
  $old_tid = $item->tid;

  // Check our manifest ('hbs_content_installed_content') for this term's machine name. If it's not found, disregard
  // the term ID from the import data since it won't apply to this instance (that TID is export cruft).
  if (empty($installed_content['terms'][$machine_name])) {
    unset($item->tid);
  }
  else {
    // If the TID exists in the 'hbs_content_installed_content' manifest, change the item object's TID to that ID value.
    $item->tid = $installed_content['terms'][$machine_name];
  }

  // See if we can find a manully-entered term that matches the one we're about to install...
  // Regardless of what's in the 'hbs_content_installed_content' manifest, we'll want to use this instead. This will
  // also neccesitate an update to that manifest, which will happen automatically after calling taxonomy_term_save().
  if (empty($item->tid)) {
    $term = array_shift(hbs_content_taxonomy_get_term_by_name_and_vocabulary($item->name, $vid));
    if (!empty($term)) {
      $item->tid = $term->tid;
    }
  }

  // Unset some potentially inaccurate metadata that will just get added by those contrib modules again anyway.
  unset($item->xmlsitemap);
  unset($item->path);

  // Last minute change to the term's VID to make sure we're not using the export CMS's VID
  $item->vid = $vid;

  // Save this term.
  taxonomy_term_save($item);

  if ($item->name == 'About') {
    variable_set('hbs_homepage_about_tid', $item->tid);
  }

  // Mark this one in our master list as installed.
  $installed_content['terms'][$machine_name] = $item->tid;

  // Needed for default node content, we'll record the term ID lookups in a separate system variable.
  $tid_lookup = variable_get('hbs_content_old_tids', array());
  $tid_lookup[$old_tid] = $item->tid;
  variable_set('hbs_content_old_tids', $tid_lookup);
}

/**
 * Helper function to load a taxonomy term by it's term name and vocabulary VID. This is better than the
 * less-than-ideal Drupal core function, taxonomy_get_term_by_name() which doesn't properly use the VID.
 */
function hbs_content_taxonomy_get_term_by_name_and_vocabulary($name, $vid) {
  return taxonomy_term_load_multiple(array(), array('name' => trim($name), 'vid' => $vid));
}

/**
 * Helper function to turn objects into arrays recursively.
 */
function _hbs_content_object_to_array($obj) {
  if (is_object($obj)) {
    $obj = (array) $obj;
  }
  if (is_array($obj)) {
    $new = array();
    foreach($obj as $key => $val) {
      $new[$key] = _hbs_content_object_to_array($val);
    }
  }
  else {
    $new = $obj;
  }
  return $new;
}



function drush_hbs_content_hbs_orgs_and_clusters($filename) {
  // Get the cluster data from the API
  drush_print('Fetching the cluster data from the API');
  $cluster_uri = url($base_url . '/data/meta/clusters', array('absolute' => TRUE));
  $results = drupal_http_request($cluster_uri);

  $clusters = array();
  foreach (json_decode($results->data) as $cluster) {
    // Use the full name as the array key since that's what's in the CSV file
    $clusters[$cluster->name_t] = array(
      'solr_reference'  => $cluster->name_t,
      'solr_id'         => $cluster->id,
      'solr_key'        => $cluster->key_t,
    );
  }


  // Get the contents of the CSV file as an array
  drush_print("Reading the contents of the CSV file ($filename)");
  ini_set('auto_detect_line_endings', TRUE);

  $file_path = __DIR__ . '/csv/' . $filename;
  $fh = fopen($file_path, 'r');
  $header = fgetcsv($fh);
  $data = array();

  while ($line = fgetcsv($fh)) {
    $data[] = array_combine($header, $line);
  }

  $header = array_shift($data);
  fclose($fh);


  // Loop through the data and edit each node we can find
  drush_print('Parsing nodes found that correspond to records in the CSV...');
  $nids = array();
  foreach ($data as $datum) {
    if (empty($nids[$datum['org_id']])) {
      // Determine the NID from the Old ID once per Old ID found
      $nid = db_select('hbs_migrate', 'm')
        ->fields('m', array('nid'))
        ->condition('type', 'organization')
        ->condition('oldid', $datum['org_id'])
        ->execute()
        ->fetchField();
      $nids[$datum['org_id']] = $nid;
    }

    // This is terribly inefficient, but...
    if (!empty($nid)) {
      $node = node_load($nid);
      if (empty($node->field_clusters)) {
        $node->field_clusters = array(LANGUAGE_NONE => array());
      }

      $has_cluster = FALSE;
      foreach ($node->field_clusters[LANGUAGE_NONE] as $node_clusters) {
        if ($node_clusters['solr_reference'] == $datum['cluster_name']) {
          $has_cluster = TRUE;
        }
      }
      if (!$has_cluster) {
        $node->field_clusters[LANGUAGE_NONE][] = $clusters[$datum['cluster_name']];
        drush_print(' * Adding cluster "' . $datum['cluster_name'] . '" to node "' . $node->title . '" (nid: ' . $node->nid . ')');
        node_save($node);
      }
    }
  }

  drush_print("\n*** Process complete. You might want to run 'drush solr-index' now.\n\n");
}


function drush_hbs_content_hbs_orgs_and_regions() {
  // Get the region data from the API
  global $base_url;
  drush_print('Fetching the region data from the API.');
  $region_uri = url($base_url . '/data/meta/regions/state', array('absolute' => TRUE));
  $results = drupal_http_request($region_uri);

  $regions = array();
  foreach (json_decode($results->data) as $region) {
    if ($region->region_type_t == 'state') {
      $regions[$region->name_t] = array(
        'solr_reference'  => $region->name_t,
        'solr_id'         => $region->id,
        'solr_key'        => strtolower(str_replace(' ', '_', $region->name_t)),
      );
    }
  }

  // Get the state values that we'll need for address fields
  $states = array(
      'AL' => t('Alabama'),
      'AK' => t('Alaska'),
      'AZ' => t('Arizona'),
      'AR' => t('Arkansas'),
      'CA' => t('California'),
      'CO' => t('Colorado'),
      'CT' => t('Connecticut'),
      'DE' => t('Delaware'),
      'DC' => t('District of Columbia'),
      'FL' => t('Florida'),
      'GA' => t('Georgia'),
      'HI' => t('Hawaii'),
      'ID' => t('Idaho'),
      'IL' => t('Illinois'),
      'IN' => t('Indiana'),
      'IA' => t('Iowa'),
      'KS' => t('Kansas'),
      'KY' => t('Kentucky'),
      'LA' => t('Louisiana'),
      'ME' => t('Maine'),
      'MD' => t('Maryland'),
      'MA' => t('Massachusetts'),
      'MI' => t('Michigan'),
      'MN' => t('Minnesota'),
      'MS' => t('Mississippi'),
      'MO' => t('Missouri'),
      'MT' => t('Montana'),
      'NE' => t('Nebraska'),
      'NV' => t('Nevada'),
      'NH' => t('New Hampshire'),
      'NJ' => t('New Jersey'),
      'NM' => t('New Mexico'),
      'NY' => t('New York'),
      'NC' => t('North Carolina'),
      'ND' => t('North Dakota'),
      'OH' => t('Ohio'),
      'OK' => t('Oklahoma'),
      'OR' => t('Oregon'),
      'PA' => t('Pennsylvania'),
      'RI' => t('Rhode Island'),
      'SC' => t('South Carolina'),
      'SD' => t('South Dakota'),
      'TN' => t('Tennessee'),
      'TX' => t('Texas'),
      'UT' => t('Utah'),
      'VT' => t('Vermont'),
      'VA' => t('Virginia'),
      'WA' => t('Washington'),
      'WV' => t('West Virginia'),
      'WI' => t('Wisconsin'),
      'WY' => t('Wyoming'),

      'AA' => t('Armed Forces (Americas)'),
      'AE' => t('Armed Forces (Europe, Canada, Middle East, Africa)'),
      'AP' => t('Armed Forces (Pacific)'),

      'AS' => t('American Samoa'),
      'FM' => t('Federated States of Micronesia'),
      'GU' => t('Guam'),
      'MH' => t('Marshall Islands'),
      'MP' => t('Northern Mariana Islands'),
      'PW' => t('Palau'),
      'PR' => t('Puerto Rico'),
      'VI' => t('Virgin Islands'),
    );

  // Get the nids of items that have address
  $nids = db_select('field_data_field_address', 'a')
    ->fields('a')
    ->condition('entity_type', 'node')
    ->condition('bundle', 'organization')
    ->execute()
    ->fetchAllAssoc('entity_id');

  foreach ($nids as $nid => $value) {
    $node = node_load($nid);
    if (empty($node->field_regions)) {
      $node->field_regions = array(LANGUAGE_NONE => array());
    }

    if (!empty($node->field_address[LANGUAGE_NONE][0]['administrative_area'])) {
      $abbr = $node->field_address[LANGUAGE_NONE][0]['administrative_area'];

      $has_region = FALSE;
      foreach ($node->field_regions[LANGUAGE_NONE] as $field_region) {
        if ($field_region['solr_reference'] == $states[$abbr]) {
          $has_region = TRUE;
        }
      }

      if (!$has_region) {
        $node->field_regions[LANGUAGE_NONE][] = $regions[$states[$abbr]];
        drush_print(' * Adding region "' . $states[$abbr] . '" to node "' . $node->title . '" (nid: ' . $node->nid . ')');
        node_save($node);
      }
    }
  }

  drush_print("\n*** Process complete. You might want to run 'drush solr-index' now.\n\n");
}


function drush_hbs_content_hbs_orgs_reversegeo() {
  $nids = array();
  $result = db_query("SELECT entity_id FROM {field_data_field_address} WHERE entity_type='node' AND bundle='organization' AND (field_address_administrative_area IS NULL OR field_address_administrative_area='') AND entity_id IN (SELECT entity_id FROM {field_data_field_location} WHERE entity_type='node' AND bundle='organization');");
  foreach ($result as $record) {
    $nids[] = $record->entity_id;
  }

  if (empty($nids)) return;
  $nodes = node_load_multiple($nids);
  foreach ($nodes as $node) {
    $location = $node->field_location[LANGUAGE_NONE][0];
    $lat = $location['lat'];
    $lng = $location['lng'];
    // status: https://code.google.com/apis/console/?noredirect#project:461024372393:stats
    $geourl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' . $lat . ',' . $lng . '&sensor=false&result_type=administrative_area_level_1&key=AIzaSyCRJhq4hzEen9k995RlMNhv1l2-MGxNHoI';

    $request = drupal_http_request($geourl);
    $data = json_decode($request->data);

    if ($data->status == 'ZERO_RESULTS') continue;

    $state = NULL;
    // We have something now...
    foreach ($data->results as $items) {
      foreach ($items->address_components as $address_component) {
        if ($address_component->types[0] == 'administrative_area_level_1') {
          $state = $address_component->short_name;
          break;
        }
      }
    }

    $node->field_address[LANGUAGE_NONE][0]['administrative_area'] = $state;

    drush_print(" * Updating node '" . $node->title . "' (" . $node->nid . ") with state $state;");
    node_save($node);
  }

  drush_print("\n*** Process complete. You might want to run 'drush solr-index' now.\n");
}




