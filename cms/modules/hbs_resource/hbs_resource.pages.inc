<?php

/**
 * @file
 * Page callback file for the HBS resource module.
 */


/**
 * Menu callback; displays a Drupal page containing recent resource entries of a certain taxonomy term.
 */
function hbs_resource_page_last($term = NULL) {
  global $user;
  $build = array();

  $vocabulary_field_names = array(
    'topic' => array('table' => 'field_data_field_topic', 'column' => 'field_topic_tid'),
    'sources' => array('table' => 'field_data_field_source', 'column' => 'field_source_tid'),
  );
  if (!empty($term)) {
    $vocabulary_field = $vocabulary_field_names[arg(1)]['table'];
    $vocabulary_field = $vocabulary_field_names[arg(1)]['table'];
  }

  $other = FALSE;
  switch (arg(2)) {
    case 'sources':
      $other = 'field_source';
      break;
    
    default:
      # code...
      break;
  }

  $query = db_select('node', 'n')->extend('PagerDefault');
  if (!empty($term)) $query->join($vocabulary_field_names[arg(1)]['table'], 't', 't.entity_id=n.nid');
  $query->fields('n', array('nid', 'sticky', 'created'));
  if (!empty($term)) $query->fields('t', array('entity_type', 'bundle', $vocabulary_field_names[arg(1)]['column'], 'entity_id'));
  $query->condition('type', 'resource');
  $query->condition('status', 1);
  if (!empty($term)) {
    $query->condition($vocabulary_field_names[arg(1)]['column'], $term->tid);
  }
  else {

  }
  $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(variable_get('default_nodes_main', 10))
    ->addTag('node_access');

  $nids = $query->execute()
    ->fetchCol();

  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    $build += node_view_multiple($nodes, 'section_teaser');
    $build['pager'] = array(
      '#theme' => 'pager',
      '#weight' => 5,
    );
  }
  else {
    drupal_set_message(t('No resource entries have been created.'));
  }

  if (empty($term)) {
    drupal_add_feed('resource/feed', t('RSS - resources'));
  }
  else {
    drupal_add_feed('resource/feed/' . $term->tid, t('RSS - !term resources', array('!term' => $term->name)));
  }

  return $build;
}


function hbs_resource_page_last_other($vocabulary = NULL) {
  global $user;
  $build = array();

  $vocabulary_field_names = array(
    'topic' => array('table' => 'field_data_field_topic', 'column' => 'field_topic_tid'),
    'sources' => array('table' => 'field_data_field_source', 'column' => 'field_source_tid'),
  );

  $vocabulary_field = $vocabulary_field_names[$vocabulary->machine_name]['table'];

  $tids = array();
  foreach (taxonomy_get_tree($vocabulary->vid) as $term) {
    $tids[] = $term->tid;
  }

  $query = db_select('node', 'n')->extend('PagerDefault');
  $query->leftJoin($vocabulary_field_names[$vocabulary->machine_name]['table'], 't', 't.entity_id=n.nid');
  $query->fields('n', array('nid', 'sticky', 'created'));
  $query->fields('t', array('entity_type', 'bundle', $vocabulary_field_names[$vocabulary->machine_name]['column'], 'entity_id'));
  $query->condition('type', 'resource');
  $query->condition('status', 1);
  $query->condition($vocabulary_field_names[$vocabulary->machine_name]['column'], NULL, 'IS');

  $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(variable_get('default_nodes_main', 10))
    ->addTag('node_access');

  $nids = $query->execute()
    ->fetchCol();

  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    $build += node_view_multiple($nodes, 'section_teaser');
    $build['pager'] = array(
      '#theme' => 'pager',
      '#weight' => 5,
    );
  }
  else {
    drupal_set_message(t('No other resource entries have been created.'));
  }

  return $build;
}


/**
 * Menu callback; displays an RSS feed containing recent resource entries.
 */
function hbs_resource_feed_last($term = NULL) {
  $nids = db_select('node', 'n')
    ->fields('n', array('nid', 'created'))
    ->fields('t', array('entity_type', 'bundle', 'field_topic_tid', 'entity_id'))
    ->condition('type', 'resource')
    ->condition('status', 1)
    ->condition('field_topic_tid', $term->tid)
    ->orderBy('created', 'DESC')
    ->range(0, variable_get('feed_default_items', 10))
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $channel['title'] = t('!site_name resources', array('!site_name' => variable_get('site_name', 'Drupal')));
  $channel['link'] = url('resource', array('absolute' => TRUE));

  node_feed($nids, $channel);
}
