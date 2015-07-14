<?php

/**
 * @file
 * Page callback file for the HBS Community module.
 */

/**
 * Menu callback; displays a mostly blank page for the inclusion of contexts for the community page.
 */
function hbs_community_page($country = NULL) {
  $build = array('country' => $country);

  $block = module_invoke('search', 'block_view', 'search');
  $build['search'] = $block;

  // Display the main map dashboard.
  $build['map'] = _hbs_community_main_map();

  // Get the most recent blog posts or resources, optionally limited by country.
  $build['blogs'] = _hbs_community_nodes('blog', $country);
  $build['resources'] = _hbs_community_nodes('resource', $country);

  $build['org_list'] = array('#markup' => views_embed_view('hbs_organization_categories', 'block_1'));
  $build['recent_members'] = array('#markup' => views_embed_view('community', 'recent_members'));
  $build['recent_orgs'] = _hbs_community_nodes('organization', $country, 'teaser');

  return theme('hbs_community_template', $build);
}

/**
 * @file
 * Page callback file for the HBS Community module.
 */

/**
 * Menu callback; displays a mostly blank page for the inclusion of contexts for the community page.
 */
function hbs_organizations_page($country = NULL) {
  global $user; 
  $build = array('country' => $country);

  $block = module_invoke('search', 'block_view', 'search');
  $build['search'] = $block;
  $build['user'] = $user;

  // Display the main map dashboard.
  $build['map'] = _hbs_community_main_map();

  // Get the most recent blog posts or resources, optionally limited by country.
  $build['blogs'] = _hbs_community_nodes('blog', $country);
  $build['resources'] = _hbs_community_nodes('resource', $country);

  $build['org_list'] = array('#markup' => views_embed_view('hbs_organization_categories', 'block_1'));
  $build['recent_members'] = array('#markup' => views_embed_view('community', 'recent_members'));
  $build['recent_orgs'] = array('#markup' => views_embed_view('community', 'recent_orgs'));

  return theme('hbs_organizations_template', $build);
}


/**
 * Helper function to get links list for the latest blogs that
 * have been promoted to the front page.
 *
 * @return array Render array of blog nodes.
 */
function _hbs_community_nodes($type = 'blog', $country = NULL, $mode = 'teaser') {
  $query = db_select('node', 'n')->extend('PagerDefault');
  $query = $query
    ->fields('n', array('nid', 'sticky', 'created'))
    ->condition('type', $type)
    ->condition('status', 1);

  if ($country) {
    $query->Join('field_data_field_regions', 'fr','fr.entity_id = n.nid');
    $query->condition('fr.field_regions_solr_key', 'region/country/' . $country);
  }

  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(variable_get('hbs_community_nodes_limit', 3))
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $nodes = array();
  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    $nodes = node_view_multiple($nodes, $mode);
  }

  return $nodes;
}


/**
 * Helper function to get the teaser for the About Use page.
 *
 * @return array Render array of a page node.
 */
function _hbs_community_main_map() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  drupal_add_js(
      array(
        'hbs_map' => array(
          'play_carousel' => false,
          'show_chart' => false,
        )
      ),
      'setting'
    );
  return $block['content'];
}

function hbs_community_config_form($form, &$form_state) {
  $form['hbs_community_nodes_limit'] = array(
    '#type' => 'textfield',
    '#title' => t('Maximum number of nodes posts'),
    '#default_value' => variable_get('hbs_community_nodes_limit', 5),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('The maximum number of nodes to display on the community page per subsection.'),
  );

  return system_settings_form($form);
}
