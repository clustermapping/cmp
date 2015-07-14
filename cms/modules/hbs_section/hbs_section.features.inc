<?php
/**
 * @file
 * hbs_section.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function hbs_section_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}
