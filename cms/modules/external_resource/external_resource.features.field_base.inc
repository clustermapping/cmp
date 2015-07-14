<?php
/**
 * @file
 * external_resource.features.field_base.inc
 */

/**
 * Implements hook_field_default_field_bases().
 */
function external_resource_field_default_field_bases() {
  $field_bases = array();

  // Exported field_base: 'field_url'
  $field_bases['field_url'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_url',
    'foreign keys' => array(),
    'indexes' => array(),
    'locked' => 0,
    'module' => 'url',
    'settings' => array(),
    'translatable' => 0,
    'type' => 'url',
  );

  return $field_bases;
}
