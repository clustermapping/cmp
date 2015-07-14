<?php
/**
 * @file
 * hbs_resource.features.taxonomy.inc
 */

/**
 * Implements hook_taxonomy_default_vocabularies().
 */
function hbs_resource_taxonomy_default_vocabularies() {
  return array(
    'authors' => array(
      'name' => 'Authors',
      'machine_name' => 'authors',
      'description' => 'Authors of content that are not in the system as CMS users or organization members',
      'hierarchy' => 0,
      'module' => 'taxonomy',
      'weight' => 0,
    ),
    'publications' => array(
      'name' => 'Publications',
      'machine_name' => 'publications',
      'description' => 'Publication sources for content.',
      'hierarchy' => 0,
      'module' => 'taxonomy',
      'weight' => 0,
    ),
    'sources' => array(
      'name' => 'Sources',
      'machine_name' => 'sources',
      'description' => '',
      'hierarchy' => 0,
      'module' => 'taxonomy',
      'weight' => 0,
    ),
  );
}
