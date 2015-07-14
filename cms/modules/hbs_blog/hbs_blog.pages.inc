<?php

/**
 * @file
 * Page callback file for the HBS blog module.
 */


/**
 * Menu callback; displays a Drupal page containing recent blog entries of a certain taxonomy term.
 */
function hbs_blog_page_last($term = NULL) {
  global $user;
  $build = array();

  $query = db_select('node', 'n')->extend('PagerDefault');
  if (!empty($term)) $query->join('field_data_field_blog_topic', 't', 't.entity_id=n.nid');
  $query->fields('n', array('nid', 'sticky', 'created'));
  if (!empty($term)) $query->fields('t', array('entity_type', 'bundle', 'field_blog_topic_tid', 'entity_id'));
  $query->condition('type', 'blog');
  $query->condition('status', 1);
  if (!empty($term)) $query->condition('field_blog_topic_tid', $term->tid);
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
    drupal_set_message(t('No blog entries have been created.'));
  }

  if (empty($term)) {
    drupal_add_feed('blog/feed', t('RSS - blogs'));
  }
  else {
    drupal_add_feed('resource/blog/' . $term->tid, t('RSS - !term blogs', array('!term' => $term->name)));
  }


  return $build;
}

/**
 * Menu callback; displays an RSS feed containing recent blog entries of all users.
 */
function hbs_blog_feed_last($term) {

  $query = db_select('node', 'n');
  $query->join('field_data_field_topic', 't', 't.entity_id=n.nid');
  $nids = $query
    ->fields('n', array('nid', 'created'))
    ->fields('t', array('entity_type', 'bundle', 'field_topic_tid', 'entity_id'))
    ->condition('type', 'blog')
    ->condition('status', 1)
    ->condition('field_topic_tid', $term->tid)
    ->orderBy('created', 'DESC')
    ->range(0, variable_get('feed_default_items', 10))
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $channel['title'] = t('!site_name blogs', array('!site_name' => variable_get('site_name', 'Drupal')));
  $channel['link'] = url('blog', array('absolute' => TRUE));

  node_feed($nids, $channel);
}
