<?php

/**
 * Form function that is used as the callback for the admin UI to upload a CSV
 * file to import organizations.
 */
function hbs_organizations_import_organizations_from_csv($form, &$form_state) {

  $form['file'] = array(
    '#type' => 'file',
    '#title' => t('CSV file'),
    '#description' => t('Upload a file, allowed extensions: csv'),
  );

  $vocabulary = taxonomy_vocabulary_machine_name_load('organization_type');
  $terms = taxonomy_get_tree($vocabulary->vid);
  $type_options = array();
  foreach ($terms as $term) {
    $type_options[$term->name] = $term->name;
  }

  $form['file_type'] = array(
    '#title' => t('Organization type'),
    '#type' => 'select',
    '#options' => $type_options,
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Upload and import'),
  );

  return $form;
}

/** 
 * Validate handler for our CSV import form.
 */
function hbs_organizations_import_organizations_from_csv_validate($form, &$form_state) {
  $file = file_save_upload('file', array(
      'file_validate_extensions' => array('csv'),
  ));
  if ($file) {
    if ($file = file_move($file, 'public://csv')) {
      $form_state['values']['file'] = $file;
    }
    else {
      form_set_error('file', t('Failed to write the uploaded file the site\'s file folder.'));
    }
  }
  else {
    form_set_error('file', t('No file was uploaded.'));
  }


}


/** 
 * Submit handler for our CSV import form.
 */
function hbs_organizations_import_organizations_from_csv_submit($form, &$form_state) {
  $file = $form_state['values']['file'];
  $file_path = drupal_realpath($file->uri);
  $values = $form_state['values'];

  ini_set('auto_detect_line_endings', TRUE);

  $fh = fopen($file_path, 'r');
  $header = fgetcsv($fh);
  $data = array();
  while ($line = fgetcsv($fh)) {
    // NOTE: This causes lots of data replication (1 per line in the CSV) but there's no way
    // to use drupal_static or other static cache when using Batch API in this way.
    $header['form_values'] = t('form_values');
    $line['form_values'] = $values;

    $data[] = array_combine($header, $line);
  }
  $header = array_shift($data);
  fclose($fh);

  $operations = array();
  $max = count($data);
  foreach ($data as $row) {
    $operations[] = array('_hbs_organizations_batch_import', array($row, $max));
  }

  $batch = array(
    'operations' => array(array('_hbs_organizations_batch_import', array($data))),
    'finished' => '_hbs_organizations_batch_finished',
    'title' => t('Processing CSV import'),
    'init_message' => t('CSV import is starting.'),
    'progress_message' => t('Importing from CSV file, @current out of @total.'),
    'error_message' => t('CSV import has encountered an error.'),
    'file' => drupal_get_path('module', 'hbs_organizations') . '/hbs_organizations.admin.inc',
  );

  batch_set($batch);
  // Only needed if not inside a form _submit handler.
  // Setting redirect in batch_process.
  batch_process('admin/content/import_org');

  drupal_set_message(t('The CSV file has been uploaded and parsed.'));
}

function _hbs_organizations_batch_import($data, &$context) {
  if (empty($context['sandbox'])) {
    $context['sandbox']['progress'] = 0;
    $context['sandbox']['current_node'] = 0;
    $context['results']['current'] = 0;
    $context['sandbox']['max'] = count($data);
  }

  $limit = 5;
  $rows = array_slice($data, $context['sandbox']['progress'], $context['sandbox']['progress'] + $limit);

  foreach ($rows as $row) {
    $node = _hbs_organizations_load_node_by_oldid($row['id'], 'organization');
    if (empty($node)) {
      // Create and save a new node based on what was imported
      $node = _hbs_organizations_create_node('organization', $row);
    }
    else {
      // Update an existing node.
      // NOTE: This will overwrite any changes made via the UI.
      $node = _hbs_organizations_update_node_data($node, $row);
    }

    $context['results'][] = $node->nid . ' : ' . check_plain($node->title);
    $context['sandbox']['progress'] ++;
    $context['sandbox']['current_node'] = $node->nid;
    $context['message'] = t('Completed import for @title (@count out of @max).', array('@title' => check_plain($node->title), '@count' => $context['sandbox']['progress'], '@max' => $context['sandbox']['max']));
  }
  if ($context['sandbox']['progress'] != $context['sandbox']['max']) {
    $context['finished'] = $context['sandbox']['progress'] / $context['sandbox']['max'];
  }
}


/**
* Batch 'finished' callback
*/
function _hbs_organizations_batch_finished($success, $results, $operations) {
  if ($success) {
    // Here we could do something meaningful with the results.
    // We just display the number of nodes we processed...
    drupal_set_message(t('@count results processed.', array('@count' => count($results))));
  }
  else {
    // An error occurred.
    // $operations contains the operations that remained unprocessed.
    $error_operation = reset($operations);
    drupal_set_message(t('An error occurred while processing the CSV file.'));
  }
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
function _hbs_organizations_create_node($type, $raw_content) {
  // Create an intial node array with our primary values. These are the values present
  // in the {node} table.
  $values = array(
    'type' => $type,
    'uid' => 1,
    'status' => 1,
    'comment' => 0,
  );

  // Set some type-specific default values
  switch ($type) {
    case 'organization':
      $values['promote'] = 0;
      $values['created'] = REQUEST_TIME;
      $values['changed'] = REQUEST_TIME;
      break;
  }

  // Turn our node array into a true node object.
  $entity = entity_create('node', $values);

  // Attach all the field and metadata values to our new node.
  $raw_content['type'] = $type;
  $entity = _hbs_organizations_update_node_data($entity, $raw_content);

  // Save the node entity
  entity_save('node', $entity);

  // Record the intial node save in our migration mapping table
  $record = array(
    'oldid' => $raw_content['id'],
    'nid' => $entity->nid,
    'type' => $entity->type,
    'src' => 'csv',
  );
  drupal_write_record('hbs_migrate', $record);

  return $entity;
}


/**
 * Helper function to get any existing node based on the original ID.
 *
 * @param   int  $oldid  The ID of the original record from the externale database
 * @return  NULL or object  Returns the node object if found, otherwise return NULL
 */
function _hbs_organizations_load_node_by_oldid($oldid, $type) {
  $nid = db_query('SELECT nid FROM {hbs_migrate} WHERE oldid = :oldid AND type=:type', array(':oldid' => $oldid, ':type' => $type))->fetchField();
  return (empty($nid)) ? NULL : node_load($nid);
}


function _hbs_migrate_get_org_type_names() {
  return array(
    'BI' => 'Business Incubator',
    'CC' => 'Chamber of Commerce',
    'CT' => 'Consultancy',
    'FF' => 'Financial Firm',
    'IA' => 'Industry Association',
    'NCA' => 'National Cluster Association',
    'OTHER' => 'Other',
    'RCI' => 'Regional Cluster Initiative',
    'REDA' => 'Regional Economic Development Agency',
    'REDI' => 'Regional Economic Development Initiative',
    'RI' => 'Research Institute',
    'TT' => 'Think-thank',
    'UOO' => 'University Outreach Organization/Tech Transfer Center',
    'RIAN Venture Development Organizations' => 'RIAN Venture Development Organizations',
    'Federal Labs Organizations' => 'Federal Labs Organizations',
  );
}

/**
 * Helper function to import all Organization Type taxonomy terms.
 */
function _hbs_migrate_load_org_type_terms($vid) {
  $terms = array();
  $term_names = _hbs_migrate_get_org_type_names();

  _hbs_migrate_create_connection();
  
  $query = db_select('hbscm_users_orgs', 'o')
    ->fields('o', array('org_type'))
    ->distinct();
  $result = $query->execute();

  db_set_active();

  while($type = $result->fetchAssoc()) {
    if (!empty($type['org_type'])) {
      $name = $term_names[$type['org_type']];

      $term = new stdClass();
      $term->name = $name;
      $term->vid = $vid;
      taxonomy_term_save($term);

      $terms[$term->tid] = $term;
      drush_print(' * Created taxonomy term ' . $term->name . ' (TID: ' . $term->tid . ').');
    }
  }

  // Save our special case term
  $term = new stdClass();
  $term->name = 'RIAN Venture Development Organizations';
  $term->vid = $vid;
  taxonomy_term_save($term);

  // Save our special case term
  $term = new stdClass();
  $term->name = 'Federal Labs Organizations';
  $term->vid = $vid;
  taxonomy_term_save($term);

  return $terms;
}

/**
 * Helper function to updates the current node object (new or updating)
 * with the current values from raw_data.
 * 
 * @param   object  $raw_content  The object representing the original column from the imported fle.
 * @param   object  $entity  The object representing the imported node.
 * @return  object  Returns the node object if found, otherwise return NULL
 */
function _hbs_organizations_update_node_data($entity, $raw_content) {
  $vid = db_query("SELECT vid FROM {taxonomy_vocabulary} WHERE machine_name=:type", array(':type' => 'organization_type'))->fetchField();
  $terms = taxonomy_term_load_multiple(array(), array('vid' => $vid));
  $term_names = _hbs_migrate_get_org_type_names();

  // If the vocabulary is blank, let's import the taxonomy terms as a one-shot deal.
  if (empty($terms)) {
    $terms = _hbs_migrate_load_org_type_terms($vid);
  }

  // The entity is now created, but we now create an entity_metadata_wrapper 
  // around the new node entity to make getting and setting values easier.
  $ewrapper = entity_metadata_wrapper('node', $entity);

  // Set the title of the node.
  $ewrapper->title->set($raw_content['name']); 

  switch($entity->type) {
    // TODO: We could do all of these together, but we'll need to do a lot more abstraction of the 
    // raw_content object first that may just not be worth the effort, since the node definitions 
    // are simple and fixed.

    case 'organization':
      // Set the body and summary values for the node.
      $body = $raw_content['profile'];
      if (preg_match('%^(?:
          [\x09\x0A\x0D\x20-\x7E]            # ASCII
        | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
        | \xE0[\xA0-\xBF][\x80-\xBF]         # excluding overlongs
        | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
        | \xED[\x80-\x9F][\x80-\xBF]         # excluding surrogates
        | \xF0[\x90-\xBF][\x80-\xBF]{2}      # planes 1-3
        | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
        | \xF4[\x80-\x8F][\x80-\xBF]{2}      # plane 16
      )*$%xs', $body)) {
        // ...
      }
      else {
        $body = iconv('CP1252', 'UTF-8', $body);
      }

      $ewrapper->body->set(array('value' => $body, 'format' => 'filtered_html'));

      // Set the address field
      $country = 'US';
      if (!empty($raw_content['country'])) {
        // _addressfield_country_options_list() returns a list of country names and their
        // corresponding codes. However, the CSV file doesn't always use the same country names.
        // USA, England, UK, and UAE are not listed in the Address Field module that way.
        // I'm using an array of all values from the CSV data to 1) prevent the name mismatch
        // and 2) keep the method of finding the country code the same, and 3) handle the 
        // England/UK/GB scenario as simply as possible.
        $countries = array(
          'USA' => 'US',
          'Taiwan' => 'TW',
          'China' => 'CN',
          'Ireland' => 'IE',
          'Canada' => 'CA',
          'Italy' => 'IT',
          'Germany' => 'DE',
          'India' => 'IN',
          'Malaysia' => 'MY',
          'Portugal' => 'PT',
          'Jordan' => 'JO',
          'Greece' => 'GR',
          'Japan' => 'JP',
          'Australia' => 'AU',
          'UAE' => 'AE',
          'England' => 'GB',
          'Spain' => 'ES',
          'UK' => 'GB',
          'Denmark' => 'DK',
          'Israel' => 'IL',
        );
        $country = $countries[$raw_content['country']];
      }

      if (!empty($raw_content['address1'])) {
        $ewrapper->field_address->thoroughfare->set($raw_content['address1']);
        $ewrapper->field_address->premise->set($raw_content['address2']);
        $ewrapper->field_address->administrative_area->set($raw_content['state']);
        $ewrapper->field_address->country->set($country);
        $ewrapper->field_address->locality->set($raw_content['city']);
        $ewrapper->field_address->postal_code->set($raw_content['zipcode']);
        $ewrapper->field_address->administrative_area->set($raw_content['state']);
      }

      if (!empty($raw_content['email'])) {
        $ewrapper->field_email->set($raw_content['email']);
      }
      if (!empty($raw_content['first_name'])) {
        $ewrapper->field_first_name->set($raw_content['first_name']);
      }
      if (!empty($raw_content['last_name'])) {
        $ewrapper->field_last_name->set($raw_content['last_name']);
      }

      // Set the coordinates
      if (!empty($raw_content['longitude']) && !empty($raw_content['latitude'])) {
        $entity->field_location[LANGUAGE_NONE] = array(
          array(
            'lat' => $raw_content['latitude'],
            'lng' => $raw_content['longitude'],
          )
        );
      }

      // Set the external website URL
      if (!empty($raw_content['website'])) {
        $entity->field_website[LANGUAGE_NONE] = array(
          array(
            'value' => $raw_content['website'],
          )
        );
      }

      // Phone/Fax
      if (!empty($raw_content['telephone'])) {
        $phone = str_replace('.', '', trim($raw_content['telephone']));
        $entity->field_website[LANGUAGE_NONE] = array(
          array(
            'numbertype' => 'work',
            'number' => $phone,
            'countrycode' => $country,
            'extension' => '',
          )
        );
      }

      // Set the org type taxonomy term
      $field_terms = array();
      if (empty($raw_content['org_type']) && empty($raw_content['org_src'])) {
        $raw_content['org_type'] = $raw_content['form_values']['file_type'];
      }
      if (!empty($raw_content['org_type'])) {
        $tid = array_shift(array_keys(taxonomy_get_term_by_name($raw_content['org_type'])));
        $entity->field_organization_type[LANGUAGE_NONE] = array(array('tid' => $tid));
      }

      break;
  }

  // Save the wrapper and presave the node entity
  $ewrapper->save(TRUE);

  return $entity;
}
