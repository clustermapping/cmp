<?php
/**
 * @file
 * hbs_blog.features.taxonomy.inc
 */

/**
 * Implements hook_taxonomy_default_vocabularies().
 */
function hbs_blog_taxonomy_default_vocabularies() {
  return array(
    'blog_topic' => array(
      'name' => 'Blog Topic',
      'machine_name' => 'blog_topic',
      'description' => 'Provides a Topics vocabulary for blog posts for Clustermapping.us content.',
      'hierarchy' => 0,
      'module' => 'taxonomy',
      'weight' => 0,
    ),
  );
}
