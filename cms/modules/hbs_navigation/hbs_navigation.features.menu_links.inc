<?php
/**
 * @file
 * hbs_navigation.features.menu_links.inc
 */

/**
 * Implements hook_menu_default_menu_links().
 */
function hbs_navigation_menu_default_menu_links() {
  $menu_links = array();

  // Exported menu link: main-menu_about:node/1550
  $menu_links['main-menu_about:node/1550'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'node/1550',
    'router_path' => 'node/%',
    'link_title' => 'About',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_about:node/1550',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -50,
    'customized' => 1,
  );
  // Exported menu link: main-menu_blog:blog
  $menu_links['main-menu_blog:blog'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'blog',
    'router_path' => 'blog',
    'link_title' => 'Blog',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_blog:blog',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -40,
    'customized' => 1,
  );
  // Exported menu link: main-menu_clusters:cluster
  $menu_links['main-menu_clusters:cluster'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'cluster',
    'router_path' => 'cluster',
    'link_title' => 'Clusters',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_clusters:cluster',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -48,
    'customized' => 1,
  );
  // Exported menu link: main-menu_organizations:organizations
  $menu_links['main-menu_organizations:organizations'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'organizations',
    'router_path' => 'organizations',
    'link_title' => 'Organizations',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_organizations:organizations',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -44,
    'customized' => 1,
  );
  // Exported menu link: main-menu_regions:region
  $menu_links['main-menu_regions:region'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'region',
    'router_path' => 'region',
    'link_title' => 'Regions',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_regions:region',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -46,
    'customized' => 1,
  );
  // Exported menu link: main-menu_resources:resource
  $menu_links['main-menu_resources:resource'] = array(
    'menu_name' => 'main-menu',
    'link_path' => 'resource',
    'router_path' => 'resource',
    'link_title' => 'Resources',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'identifier' => 'main-menu_resources:resource',
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
  t('About');
  t('Blog');
  t('Clusters');
  t('Organizations');
  t('Regions');
  t('Resources');


  return $menu_links;
}
