<?php
/**
 * @file
 * hbs_organizations.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function hbs_organizations_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "corresponding_node_references" && $api == "default_corresponding_node_references_presets") {
    return array("version" => "1");
  }
  if ($module == "field_group" && $api == "field_group") {
    return array("version" => "1");
  }
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_views_api().
 */
function hbs_organizations_views_api($module = NULL, $api = NULL) {
  return array("api" => "3.0");
}

/**
 * Implements hook_node_info().
 */
function hbs_organizations_node_info() {
  $items = array(
    'member' => array(
      'name' => t('Member'),
      'base' => 'node_content',
      'description' => t('Members are people who belong to one or more Organizations. A Member may or may not be associated with a CMS user account, but all Members can be associated.'),
      'has_title' => '1',
      'title_label' => t('Member Name'),
      'help' => '',
    ),
    'organization' => array(
      'name' => t('Organization'),
      'base' => 'node_content',
      'description' => t('Information about an organization to which Members can belong.'),
      'has_title' => '1',
      'title_label' => t('Name'),
      'help' => '',
    ),
  );
  return $items;
}
