<?php
/**
 * @file
 * hbs_add_content_links.features.field_base.inc
 */

/**
 * Implements hook_field_default_field_bases().
 */
function hbs_add_content_links_field_default_field_bases() {
  $field_bases = array();

  // Exported field_base: 'field_member_ref'
  $field_bases['field_member_ref'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_member_ref',
    'foreign keys' => array(
      'nid' => array(
        'columns' => array(
          'nid' => 'nid',
        ),
        'table' => 'node',
      ),
    ),
    'indexes' => array(
      'nid' => array(
        0 => 'nid',
      ),
    ),
    'locked' => 0,
    'module' => 'node_reference',
    'settings' => array(
      'referenceable_types' => array(
        'blog' => 0,
        'member' => 'member',
        'organization' => 0,
        'page' => 0,
        'resource' => 0,
      ),
      'view' => array(
        'args' => array(),
        'display_name' => 'references_1',
        'view_name' => 'member_reference',
      ),
    ),
    'translatable' => 0,
    'type' => 'node_reference',
  );

  return $field_bases;
}
