<?php
/**
 * @file
 * hbs_section.strongarm.inc
 */

/**
 * Implements hook_strongarm().
 */
function hbs_section_strongarm() {
  $export = array();

  $strongarm = new stdClass();
  $strongarm->disabled = FALSE; /* Edit this to true to make a default strongarm disabled initially */
  $strongarm->api_version = 1;
  $strongarm->name = 'pathauto_taxonomy_term_section_pattern';
  $strongarm->value = '[term:name]';
  $export['pathauto_taxonomy_term_section_pattern'] = $strongarm;

  return $export;
}
