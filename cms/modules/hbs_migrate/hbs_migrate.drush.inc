<?php

/**
 * Implements hook_drush_command().
 */
function hbs_migrate_drush_command() {
  $items = array();

  $items['hbs_import'] = array(
    'description' => "Imports content for HBS Clustermapping",
    'arguments' => array(
      'type' => 'The type of content to import (blog, resource)',
    ),
    'examples' => array(
      'drush hbsimp blog' => 'Import HBS Clustermapping blog content',
    ),
    'aliases' => array('hbsimp'),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
  );

  $items['hbs_update_addresses'] = array(
    'description' => "Imports address data for organizations to fill in the gaps",
    'examples' => array(
      'drush hbs_update_addresses' => 'Import missing address information',
    ),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
  );

  $items['hbs_user_import'] = array(
    'description' => "Imports content for HBS Clustermapping",
    'examples' => array(
      'drush hbs_user_import' => 'Import HBS Clustermapping blog content',
    ),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
  );

  return $items;
}

/**
 * Drush command callback for the 'hbs_import' command.
 */
function drush_hbs_migrate_hbs_import($type = 'blog') {
  // See if we can get a connection to the external database from which to pull content.
  if (!_hbs_migrate_create_connection()) {
    db_set_active();
    return;
  }

  // Get the complete set of table rows that we'll parse row by row based on content type.
  $raw_contents = array();
  $id_name = _hbs_migrate_get_old_id_name($type);

  $entity_type = NULL;

  drush_print('Begin import "' . $type . '" type nodes.');
  switch($type) {
    case 'blog':
      $raw_contents = db_select('hbscm_blog', 'b')
        ->fields('b')
        ->execute()
        ->fetchAllAssoc($id_name);
      $entity_type = 'node';
      break;

    case 'resource':
      $raw_contents = db_select('hbscm_blocks_resource_item', 'r')
        ->fields('r')
        ->execute()
        ->fetchAllAssoc($id_name);
      $entity_type = 'node';
      break;

    case 'organization':
        $raw_contents = db_select('hbscm_users_orgs', 'o')
          ->fields('o')
          ->execute()
          ->fetchAllAssoc($id_name);
      $entity_type = 'node';
      break;

    case 'cluster':
      $raw_contents = db_select('hbscm_data_naics_clusters', 'c')
        ->fields('c')
        ->execute()
        ->fetchAllAssoc($id_name);
      $entity_type = 'term';
      break;
      
  }

  // SUPER IMPORTANT: Set us back to using the primary Drupal database connection.
  db_set_active();

  // Loop through each row and create/update nodes based on what we get back.
  if (!empty($raw_contents) && !is_null($entity_type)) {
    call_user_func('_hbs_migrate_process_import_' . $entity_type, $raw_contents, $type);
  }
}

function _hbs_migrate_process_import_node($raw_contents, $type) {
  foreach ($raw_contents as $oldid => $raw_content) {
    $raw_content->type = $type;
    $id_name = _hbs_migrate_get_old_id_name($type);

    $node = _hbs_migrate_load_node_by_oldid($raw_content->{$id_name}, $type);

    if (empty($node)) {
      // Create and save a new node based on what was imported
      $node = _hbs_migrate_create_node($type, $raw_content);
      drush_print(' * Saved ' . $type . ' node: "' . $node->title . '"');
    }
    else {
      // Update an existing node.
      // NOTE: This will overwrite any changes made via the UI.
      $node = _hbs_migrate_update_node($raw_content);
      drush_print(' * Updating: "' . $node->title . '" node ' . $node->nid . ' was already present.');
    }
  }
}

function _hbs_migrate_process_import_term($raw_contents, $type) {
  foreach ($raw_contents as $oldid => $raw_content) {
    $vnames = array('cluster' => 'clusters');
    $vid = db_query("SELECT vid FROM {taxonomy_vocabulary} WHERE machine_name=:type", array(':type' => $clusters[$type]))->fetchField();

    $name = '';

    switch ($type) {
      case 'cluster':
        $name = (empty($raw_content->label)) ? $raw_content->cluster_name : $raw_content->label;
        break;
      
      default:
        # code...
        break;
    }

    $term = array(
      'name' => $name,
      'vid' => $vid,
    );
    $term = taxonomy_term_save((object) $term);
    drush_print(' * Saved ' . $type . ' taxonomy term: "' . $term->name . '" (TID: ' . $term->tid . ')');
  }
}

/**
 * Helper function to get the original unique ID name from the source database.
 *
 * @param   string  $type   The content type for which we want the original ID name
 * @return  string  The original ID name from the source database
 */
function _hbs_migrate_get_old_id_name($type) {
  $id_names = array('blog' => 'blog_id', 'resource' => 'ri_id', 'organization' => 'org_id', 'cluster' => 'id');
  return $id_names[$type];
}

/**
 * Helper function to get the original unique ID name from the source database.
 *
 * @param   string  $type   The content type for which we want the original ID name
 * @return  string  The original ID name from the source database
 */
function _hbs_migrate_get_old_title_name($type) {
  $title_names = array('blog' => 'blog_title', 'resource' => 'ri_box_file', 'organization' => 'org_title');
  return $title_names[$type];
}

/**
 * Helper function to get any existing node based on the original ID.
 *
 * @param   int  $oldid  The ID of the original record from the externale database
 * @return  NULL or object  Returns the node object if found, otherwise return NULL
 */
function _hbs_migrate_load_node_by_oldid($oldid, $type) {
  $nid = db_query('SELECT nid FROM {hbs_migrate} WHERE oldid = :oldid AND type=:type AND src=:src', array(':oldid' => $oldid, ':type' => $type, ':src' => 'db'))->fetchField();
  return (empty($nid)) ? NULL : node_load($nid);
}

/**
 * Helper function to updates the current node object (new or updating)
 * with the current values from raw_data.
 * 
 * @param   object  $raw_content  The object representing the original column from the external database.
 * @return  object  Returns the node object if found, otherwise return NULL
 */
function _hbs_migrate_update_node($raw_content) {
  $id_name = _hbs_migrate_get_old_id_name($raw_content->type);
  $node = _hbs_migrate_load_node_by_oldid($raw_content->$id_name, $raw_content->type);
  $node = _hbs_migrate_update_node_data($node, $raw_content);
  entity_save('node', $node);
  return $node;
}

/**
 * Helper function to create a new node from scratch. This uses entity wrappers
 * to help with any node hooks that need to be invoked when dealing with new 
 * nodes. 
 *
 * @param   string  $type  The content type being instantiated.
 * @param   object  $raw_content  The object representing the original column from the external database.
 * @return  object  Returns the node object that has just been created.
 */
function _hbs_migrate_create_node($type, $raw_content) {
  // Create an intial node array with our primary values. These are the values present
  // in the {node} table.
  $values = array(
    'type' => $type,
    'uid' => 1,
    'status' => 1,
    'comment' => 0,
  );

  // Set some type-specific default values
  $extras = array();
  switch ($type) {
    case 'blog':
      $values['promote'] = (int) $raw_content->blog_featured;
      $values['created'] = (int) $raw_content->blog_created;
      $values['changed'] = (int) $raw_content->blog_created;
      break;
    case 'resource':
      $values['promote'] = 0;
      $values['created'] = REQUEST_TIME;
      $values['changed'] = REQUEST_TIME;
      break;
    case 'organization':
      $values['promote'] = 0;
      $values['created'] = strtotime($raw_content->org_creation_date);
      $values['changed'] = strtotime($raw_content->org_last_modified);
      break;
  }
  // print_r($raw_content);
  // exit;

  // Turn our node array into a true node object.
  $entity = entity_create('node', $values);

  // Attach all the field and metadata values to our new node.
  $entity = _hbs_migrate_update_node_data($entity, $raw_content);

  // Save the node entity
  entity_save('node', $entity);

  // Record the intial node save in our migration mapping table
  $id_name = _hbs_migrate_get_old_id_name($type);
  $record = array(
    'oldid' => $raw_content->$id_name,
    'nid' => $entity->nid,
    'type' => $entity->type,
    'src' => 'db',
  );
  drupal_write_record('hbs_migrate', $record);

  return $entity;
}

function _hbs_migrate_update_node_data($entity, $raw_content) {
  // The entity is now created, but we now create an entity_metadata_wrapper 
  // around the new node entity to make getting and setting values easier.
  $ewrapper = entity_metadata_wrapper('node', $entity);

  // Set the title of the node.
  $title_name = _hbs_migrate_get_old_title_name($raw_content->type);
  if ($entity->type == 'resource') {
    $ewrapper->title->set(_hbs_migrate_title_clean($raw_content->$title_name));
  }
  else {
    $ewrapper->title->set($raw_content->$title_name);
  }

  // If there's an image or file present, we'll need to:
  //   1) copy it locally
  //   2) enter it into the file table
  //   3) add it to the node
  switch($entity->type) {
    // TODO: We could do all of these together, but we'll need to do a lot more abstraction of the 
    // raw_content object first that may just not be worth the effort, since the node definitions 
    // are simple and fixed.

    case 'blog':
      // Set the body and summary values for the node.
      $my_body_content = _hbs_migrate_clean_body_copy($raw_content->blog_full_description);
      $ewrapper->body->set(array('value' => $my_body_content, 'format' => 'filtered_html'));
      $ewrapper->body->summary->set($raw_content->blog_short_description);

      // Do this for images...
      if (!empty($raw_content->blog_image)) {
        if ($file = _hbs_migrate_save_remote_file($raw_content->blog_image, 'images/blog')) {
          $ewrapper->field_image->set($file);
        }
      }

      // ...and do the same for other files.
      if (!empty($raw_content->blog_file)) {
        $file = _hbs_migrate_save_remote_file($raw_content->blog_file, 'files/blog');
        $file['display'] = 1;
        $file['description'] = '';
        $ewrapper->field_file->set($file);
      }
      break;

    case 'resource':
      // Set the body and summary values for the node.
      $my_body_content = $raw_content->ri_text;
      $ewrapper->body->set(array('value' => $my_body_content, 'format' => 'filtered_html'));
      $ewrapper->body->summary->set($raw_content->blog_short_description);

      // Do this for images if they exist on the origin server...
      if (!empty($raw_content->ri_box_image)) {
        if ($file = _hbs_migrate_save_remote_file($raw_content->ri_box_image, 'images/resource', 'http://mvp.clustermapping.us/uploads/')) {
          // Some image files don't actually exist on the origin server
          $ewrapper->field_image->set($file);
        }
      }

      // ...and do the same for other files if they exist on the origin server.
      if (!empty($raw_content->ri_box_file)) {
        $file = _hbs_migrate_save_remote_file($raw_content->ri_box_file, 'files/resource', 'http://mvp.clustermapping.us/download/');

        // The mvp URL may not always be correct, so if we get nothing there, look on the main server
        if (empty($file)) {
          $file = _hbs_migrate_save_remote_file($raw_content->ri_box_file, 'files/resource', 'http://clustermapping.us/files/blocks_resource_item/binary/');
        }

        if (!empty($file)) {
          $file['display'] = 1;
          $file['description'] = '';
          $ewrapper->field_file->set($file);
        }
      }

      break;

    case 'organization':
      _hbs_migrate_create_connection();
      $people_id = db_query("SELECT people_id FROM {hbscm_users_people_to_orgs} WHERE org_id=:org_id", array(':org_id' => $raw_content->org_id))->fetchField();
      $query = db_select('hbscm_users_people', 'p')
          ->fields('p')
          ->condition('people_id', $people_id);
      $result = $query->execute();
      $details = array();
      while($record = $result->fetchAssoc()) {
        $details = array(
          'email' => $record['people_login'],
          'first_name' => $record['people_first_name'],
          'last_name' => $record['people_last_name'],
        );
      }
      db_set_active();

      // Set the body and summary values for the node.
      module_load_include('inc', 'hbs_organizations', 'hbs_organizations.admin');
      $address = array(
        'address1' => $raw_content->org_street_address_1,
        'address2' => $raw_content->org_street_address_2,
        'city' => '',
        'state' => $raw_content->org_state,
        'zipcode' => $raw_content->org_zip,
        'country' => $raw_content->org_id,
      );
      $address = _hbs_migrate_normalize_address($raw_content->org_old_address, $address);

      $content_data = array(
        'id' => $raw_content->org_id,
        'name' => $raw_content->org_title,
        'telephone' => $raw_content->org_phone,
        'fax' => '',
        'email' => '',
        'website' => $raw_content->org_website,
        'latitude' => $raw_content->org_latitude,
        'longitude' => $raw_content->org_longitude,
        'profile' => $raw_content->org_description,
        'org_type' => $raw_content->org_type,
        'src' => 'db',
      );
      $content_data += $address;
      $content_data += $details;
      $entity = _hbs_organizations_update_node_data($entity, $content_data);
      // $my_body_content = _hbs_migrate_clean_body_copy($raw_content->org_description);
      // $ewrapper->body->set(array('value' => $my_body_content, 'format' => 'filtered_html'));
      break;
  }

  // Save the wrapper and presave the node entity
  $ewrapper->save(TRUE);

  return $entity;
}

/** 
 * Helper function to normalize various address data points.
 */
function _hbs_migrate_normalize_address($old_address, $address_fields) {
  $address1 = $address2 = $city = $state = $zip = NULL;

  $lines = explode("\n", $old_address);
  foreach ($lines as $key => &$value) {
    $value = trim($value);
    if (empty($value)) {
      unset($lines[$key]);
    }
  }

  if (count($lines) > 1) {
    list($city, $state) = explode(',', $lines[count($lines) - 1]);
  }
  $address1 = (empty($address_fields['address1'])) ? $lines[0] : $address_fields['address1'];
  $address2 = (empty($address_fields['address2'])) ? (count($lines) == 3) ? $lines[1] : '' : $address_fields['address2'];
  $state = (empty($address_fields['state'])) ? $state : $address_fields['state'];
  $zip = (empty($address_fields['zipcode'])) ? '' : $address_fields['zipcode'];

  $address = array(
    'address1' => $address1,
    'address2' => $address2,
    'city' => $city,
    'state' => $state,
    'zipcode' => $zip,
    'country' => 'US',
  );

  return $address;
}

/**
 * Helper function to save a remote file.
 *
 * @param   string  $filename  The filename (without path) of the file we want to migrate
 * @param   string  $subpath   The Subpath within Drupal's files directory where we want to save the new version of the file.
 * @return  array   The file object (as an array) stored in the {files_managed} table. This is returned as an array because it will be used as a field value.
 */
function _hbs_migrate_save_remote_file($filename, $subpath, $base_url = 'http://www.clustermapping.us/files/blog/') {
  $file_uri = file_default_scheme() . '://' . $subpath . '/' . $filename;

  // See if this file already exists
  $files = file_load_multiple(array(), array('uri' => $file_uri));
  $file = reset($files); // If empty, $file will be false, otherwise it will contain the desired file

  if (empty($file)) {
    // Make sure the file's parent directory exists
    $dir = file_default_scheme() . '://' . $subpath;
    file_prepare_directory($dir);

    // Fetch the file from the current site and save it as a Drupal managed file
    $url = $base_url . $filename;
    $newfile = file_directory_temp() . '/' . $filename;
    $file_contents = @file_get_contents($url); // The URL might not be valid.
    drush_print("   - Copying file from $url");
    if (!empty($file_contents)) {
      $file = file_save_data($file_contents, $file_uri, FILE_EXISTS_REPLACE);
      $file->uid = 1;
      // TODO: Will need to update the files to be owned by someone besides UID 0
    }
    else {
      // If we get a non-200 for the file, we'll return an empty array so we 
      // don't try to download something that doesn't exist.
      return array();
    }
  }

  // Return the File object as an array for use as a file field
  return (array) $file;
}

/** 
 * Helper function to return the neccessary connection information for
 * connecting to the external database for content migration.
 */
function _hbs_migrate_get_connection() {
  return array(
    'database'  => variable_get('hbs_migrate_hbs_import_database', 'clustermapping_us'),
    'username'  => variable_get('hbs_migrate_hbs_import_username', 'csuser'),
    'password'  => variable_get('hbs_migrate_hbs_import_password', 'cspass1!'),
    'host'      => variable_get('hbs_migrate_hbs_import_host', 'currentsite.cwsjnccykjht.us-east-1.rds.amazonaws.com'),
    'driver'    => 'mysql',
  );
}

/**
 * Helper function to create a database connection to an external database.
 * @return  Boolean   Whether or not  the connection was successfully created.
 */
function _hbs_migrate_create_connection() {
  $clustermapping_us_database = _hbs_migrate_get_connection();

  // replace 'YourDatabaseKey' with something that's unique to your module
  Database::addConnectionInfo('clustermapping_us', 'default', $clustermapping_us_database);
  if (db_set_active('clustermapping_us')) {
    drush_print(' ✓ Migration database connection was successful');
    return TRUE;
  }

  drush_print('*** Could not connect to migration database');
  return FALSE;
}

/**
 * Helper function to clean up unretty titles.
 */
function _hbs_migrate_title_clean($orig_title) {
  $title = $orig_title;
  $title = str_replace('_', ' ', $title);
  $title = str_replace('---', ' - ', $title);
  $title = str_replace('.pdf', '', $title);
  $title = preg_replace("/(\s){2,}/", '$1',$title);
  $title = preg_replace("/(\w)\- /", '$1: ', $title);
  $title = str_replace(' s ', "'s ", $title);
  $title = trim($title);
  return $title;
}


function _hbs_migrate_get_link_url($internal_link, $art_wideid) {
  // Raw internal links sometimes look like:
  // {internal_link:21,art_wideid=86,art_widemode=details}

  // select * from hbscm_blocks_containers
  // inner join hbscm_blocks
  // inner join hbscm_blocks_resource_item
  // where 
  // hbscm_blocks_containers.bc_content_id=86 and hbscm_blocks_containers.bc_id=hbscm_blocks.block_bc_id and hbscm_blocks.block_id=hbscm_blocks_resource_item.ri_block_id
  $resource_id = NULL;
  if (_hbs_migrate_create_connection()) {
    $query = db_select('hbscm_blocks_containers', 'bc');
    $query->join('hbscm_blocks', 'b', 'bc.bc_id=b.block_bc_id');
    $query->join('hbscm_blocks_resource_item', 'bri', 'b.block_id=bri.ri_block_id');
    $query->fields('bc');
    $query->fields('b');
    $query->fields('bri');
    $query->condition('bc.bc_content_id', $art_wideid);
    $result = $query->execute();
    while($record = $result->fetchAssoc()) {
      $resource_id = $record['ri_id'];
    }
  }
  db_set_active();

  if (!empty($resource_id)) {
    $nid = db_select('hbs_migrate', 'm')
      ->fields('m', array('nid'))
      ->condition('oldid', $resource_id)
      ->condition('type', 'resource')
      ->condition('src', 'db')
      ->execute()
      ->fetchField();
    return url("node/$nid");
  }
  return '#';
}
 

function _hbs_migrate_clean_body_copy($body) {
  if (preg_match("/\<a href=\"{(.*?)}\"/", $body, $matches)) {

    $internal_link = FALSE;
    $art_wideid = FALSE;
    foreach (explode(',', $matches[1]) as $value) {
      $items = split("[\=\:]", $value);
      // var_export($items);
      if (isset(${$items[0]})) {
        ${$items[0]} = $items[1];
      }
    }

    if ($internal_link == 46 && !$art_wideid) {
      // In the old CMS, internal_link:46 was the user registration path.
      // References to that had no article ID.
      $link_url = url('user');
    }
    else {
      $link_url = _hbs_migrate_get_link_url($internal_link, $art_wideid);
    }

    $body = str_replace('{' . $matches[1] . '}', $link_url, $body);
  }

  return $body;
}


function drush_hbs_migrate_hbs_update_addresses() {
  drush_print('Contacting the live database to fetch organization data');
  // See if we can get a connection to the external database from which to pull content.
  if (!_hbs_migrate_create_connection()) {
    db_set_active();
    return;
  }

  $raw_contents = db_select('hbscm_users_orgs', 'o')
    ->fields('o')
    ->execute()
    ->fetchAllAssoc('org_id');
    
  // SUPER IMPORTANT: Set us back to using the primary Drupal database connection.
  db_set_active();


  if (!empty($raw_contents)) {
    foreach ($raw_contents as $oldid => $raw_content) {
      // drush_print('Old ID: ' . $oldid);

      $nid = db_select('hbs_migrate', 'm')
        ->fields('m', array('nid'))
        ->condition('oldid', $oldid)
        ->condition('type', 'organization')
        ->condition('src', 'db')
        ->execute()
        ->fetchField();
      // drush_print('NID: ' . $nid);
      if (!empty($nid)) {
        $node = node_load($nid);
        // print_r($node->field_address[LANGUAGE_NONE]);
        // print_r($raw_content);

        $raw_address = _hbs_migrate_get_address_data($raw_content);

        $address_field = array(
          'country'                 => $raw_address['country'],
          'administrative_area'     => $raw_address['state'],
          'sub_administrative_area' => NULL,
          'locality'                => NULL,
          'dependent_locality'      => NULL,
          'postal_code'             => $raw_address['zip'],
          'thoroughfare'            => $raw_address['address1'],
          'premise'                 => $raw_address['address2'],
          'sub_premise'             => NULL,
          'organisation_name'       => NULL,
          'name_line'               => NULL,
          'first_name'              => NULL,
          'last_name'               => NULL,
          'data'                    => NULL,
        );

        $node->field_address[LANGUAGE_NONE][0] = $address_field;
        drush_print(" * Updating '" . $node->title . "' (" . $node->nid . ")");
        node_save($node);

        // exit;
      }
    }
  }

  drush_print("\n\n*** It would be wise to run 'drush solr-index' now.\n\n");
}

function _hbs_migrate_get_address_data($raw_content) {

  $countries = array(
    ''  => 'US',
    0   => 'US',
    36  => 'US',
    32  => 'TR',
  );
  $address = array(
    'address1'  => $raw_content->org_street_address_1,
    'address2'  => $raw_content->org_street_address_2,
    'city'      => NULL,
    'zip'       => $raw_content->org_zip,
    'state'     => $raw_content->org_state,
    'country'   => $countries[$raw_content->org_country_id],
  );

  // Catch missing address fields
  if (empty($address['address1']) && !empty($raw_content->org_old_address)) {
    // $pieces = explode('   ', $raw_content->org_old_address);
    $pieces = preg_split('/[ ]{2,}|\r?\n|,/', $raw_content->org_old_address);
    foreach ($pieces as $key => &$value) {
      $value = trim($value);
      if (empty($value)) {
        unset($pieces[$key]);
      }
    }
    // print_r($pieces);

    $last = count($pieces) - 1;

    if (count($pieces)) {
      $address['address1'] = trim($pieces[0]);
      if (count($pieces) > 2) {
        $address['address2'] = trim($pieces[1]);
      }
      if (count($pieces) > 1) {
        $piece = trim($pieces[$last]);
        if (strlen($piece) > 2) {
          $address['city'] = $piece;
        }
        else {
          // $address['state'] = trim($pieces[count($pieces) - 1]);
        }
        
      }
    }
  }

  // Catch missing countries
  if (empty($countries[$raw_content->org_country_id])) {
    drush_print(" ** Invalid country code: " . $raw_content->org_country_id);
    print_r($raw_content);
    exit;
  }

  if (empty($address['city']) && !empty($raw_content->org_old_address)) {
    $pieces = preg_split('/[ ]{2,}|\r?\n|,/', $raw_content->org_old_address);
    foreach ($pieces as $key => &$value) {
      $value = trim($value);
      if (empty($value)) {
        unset($pieces[$key]);
      }
    }

    $city = trim(array_pop($pieces));
    if (!empty($address['state']) && !empty($city)) {
      $address['city'] = $city;
    }

    if (empty($address['address1'])) {
      drush_print(" ** Invalid address1: " . $raw_content->org_old_address);
      exit;
    }
    if (empty($address['city'])) {
      if ($raw_content->org_old_address != 'Virtual') {
        if (!empty($city)) {
          $address['city'] = $city;
        }
        else {
          drush_print(" ** Invalid city: " . $raw_content->org_old_address);
          print_r($pieces);
          print_r($address);
          exit;
        }
      }
    }
  }

  if (empty($address['address1'])) {
    drush_print("\n\n *** Does not have an address1 field.");
    // print_r($raw_content);
    // print_r($address);
    // exit;
  }

  // drush_print($raw_content->org_old_address . ' turns into...');
  // print_r($address);

  return $address;
}

function drush_hbs_migrate_hbs_user_import() {
  // See if we can get a connection to the external database from which to pull content.
  if (!_hbs_migrate_create_connection()) {
    db_set_active();
    return;
  }

  drush_print('Begin user import.');

  $query = db_select('hbscm_users', 'u');
  $query->leftJoin('hbscm_users_people', 'p', 'u.user_id = p.people_id');
  $query->leftJoin('hbscm_users_people_to_orgs', 'po', 'p.people_id = po.people_id');
  $query->leftJoin('hbscm_users_orgs', 'o', 'po.org_id = o.org_id');
  $query->groupBy('u.user_id');
  $query
    ->fields('u')
    ->fields('p')
    ->fields('o', array('org_title'));

  // SUPER IMPORTANT: Set us back to using the primary Drupal database connection.
  db_set_active();

  $imported_users = variable_get('hbs_migrate_imported_users', array());
  $count = 0;

  // Start combing through the query data and create some user accounts
  $result = $query->execute();
  while($record = $result->fetchAssoc()) {
    if (empty($imported_users[$record['user_id']])) {
      $login = trim(trim($record['user_fname']) . ' ' . trim($record['user_lname']));
      $existing_account = user_load_by_name($login);

      if (!empty($login) && $login != 'no-fname no-lname') {
        $password = $record['user_password'];
        unset($record['user_password']);
        $fields = array(
          'name' => $login,
          'mail' => $record['user_login'],
          'pass' => $password,
          'status' => 1,
          'init' => $record['user_login'],
          'roles' => array(
            DRUPAL_AUTHENTICATED_RID => 'authenticated user',
          ),
          'data' => array(
            'import' => $record,
          ),
        );

        if (empty($existing_account)) {
          $account = user_save('', $fields);
          drush_print(" * CREATED a new user: $login");
          $member_node = _hbs_migrate_create_member($account);

          // We need to add the member reference to the user account and re-save it.
          $account->field_member_reference = array(
            LANGUAGE_NONE => array(
              array(
                'nid' => $member_node->nid,
              ),
            ),
          );
          $account = user_save($account);
          
          $count ++;
        }
        else {
          $account = user_save($existing_account, $fields);
          drush_print(" * UPDATED an existing user: $login");
        }
        
        $imported_users[$record['user_id']] = $account->uid;
      }
    }
  }
  variable_set('hbs_migrate_imported_users', $imported_users);

  drush_print('Imported ' . $count . ' users.');

}

function _hbs_migrate_create_member($account) {
  $values = array(
    'type'    => 'member',
    'uid'     => $account->uid,
    'status'  => 1,
    'comment' => 0,
    'promote' => 0,
    'sticky'  => 0,
    'created' => REQUEST_TIME,
    'changed' => REQUEST_TIME,
    'path'    => array('pathauto' => 1),
    'title'   => $account->name,
  );

  // Turn our node array into a true node object.
  $entity = entity_create('node', $values);

  // Set the user/membership relationship
  $entity->field_user = array(
    LANGUAGE_NONE => array(
      array(
        'uid' => $account->uid,
      ),
    ),
  );

  // Set the organization/member relationship, if one exists.
  $organization_nid = db_select('node', 'n')
    ->fields('n', array('nid'))
    ->condition('type', 'organization')
    ->condition('title', $account->data['import']['org_title'])
    ->execute()
    ->fetchField();

  if(!empty($organization_nid)) {
    $entity->field_organization = array(
      LANGUAGE_NONE => array(
        array(
          'nid' => $organization_nid,
        ),
      ),
    );
  }

  // Save the node entity
  entity_save('node', $entity);
  return($entity);
}
