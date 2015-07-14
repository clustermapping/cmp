<?php
/**
 * @file
 * hbs_add_content_links.features.menu_custom.inc
 */

/**
 * Implements hook_menu_default_menu_custom().
 */
function hbs_add_content_links_menu_default_menu_custom() {
  $menus = array();

  // Exported menu: menu-add-content.
  $menus['menu-add-content'] = array(
    'menu_name' => 'menu-add-content',
    'title' => 'Add Content',
    'description' => 'User add content links.',
  );
  // Translatables
  // Included for use with string extractors like potx.
  t('Add Content');
  t('User add content links.');


  return $menus;
}
