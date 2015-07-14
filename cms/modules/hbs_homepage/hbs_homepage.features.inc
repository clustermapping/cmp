<?php
/**
 * @file
 * hbs_homepage.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function hbs_homepage_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}
