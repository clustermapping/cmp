<?php
/**
 * @file
 * hbs_add_content_links.features.menu_links.inc
 */

/**
 * Implements hook_menu_default_menu_links().
 */
function hbs_add_content_links_menu_default_menu_links() {
  $menu_links = array();

  // Exported menu link: menu-add-content_add-blog-post:node/add/blog
  $menu_links['menu-add-content_add-blog-post:node/add/blog'] = array(
    'menu_name' => 'menu-add-content',
    'link_path' => 'node/add/blog',
    'router_path' => 'node/add/blog',
    'link_title' => 'Add Blog Post',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'menu-add-content_add-blog-post:node/add/blog',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -50,
    'customized' => 1,
  );
  // Exported menu link: menu-add-content_add-member-profile:node/add/member
  $menu_links['menu-add-content_add-member-profile:node/add/member'] = array(
    'menu_name' => 'menu-add-content',
    'link_path' => 'node/add/member',
    'router_path' => 'node/add/member',
    'link_title' => 'Add Member Profile',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'menu-add-content_add-member-profile:node/add/member',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -44,
    'customized' => 1,
  );
  // Exported menu link: menu-add-content_add-organization:node/add/organization
  $menu_links['menu-add-content_add-organization:node/add/organization'] = array(
    'menu_name' => 'menu-add-content',
    'link_path' => 'node/add/organization',
    'router_path' => 'node/add/organization',
    'link_title' => 'Add Organization',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'menu-add-content_add-organization:node/add/organization',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -46,
    'customized' => 1,
  );
  // Exported menu link: menu-add-content_add-resource:node/add/resource
  $menu_links['menu-add-content_add-resource:node/add/resource'] = array(
    'menu_name' => 'menu-add-content',
    'link_path' => 'node/add/resource',
    'router_path' => 'node/add/resource',
    'link_title' => 'Add Resource',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'menu-add-content_add-resource:node/add/resource',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -48,
    'customized' => 1,
  );
  // Exported menu link: menu-add-content_login:user/login
  $menu_links['menu-add-content_login:user/login'] = array(
    'menu_name' => 'menu-add-content',
    'link_path' => 'user/login',
    'router_path' => 'user/login',
    'link_title' => 'Login',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'menu-add-content_login:user/login',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -42,
    'customized' => 1,
  );
  // Translatables
  // Included for use with string extractors like potx.
  t('Add Blog Post');
  t('Add Member Profile');
  t('Add Organization');
  t('Add Resource');
  t('Login');


  return $menu_links;
}
