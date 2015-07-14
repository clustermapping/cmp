<?php
/**
 * @file
 * hbs_organizations.features.taxonomy.inc
 */

/**
 * Implements hook_taxonomy_default_vocabularies().
 */
function hbs_organizations_taxonomy_default_vocabularies() {
  return array(
    'organization_type' => array(
      'name' => 'Organization Type',
      'machine_name' => 'organization_type',
      'description' => '',
      'hierarchy' => 0,
      'module' => 'taxonomy',
      'weight' => 0,
    ),
  );
}
