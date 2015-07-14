<?php
/**
 * @file
 * external_resource.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function external_resource_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_node_info().
 */
function external_resource_node_info() {
  $items = array(
    'external_resource' => array(
      'name' => t('Link (External Resource)'),
      'base' => 'node_content',
      'description' => t('Provides a brief description and a link to an external resource outside this site.'),
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  return $items;
}
