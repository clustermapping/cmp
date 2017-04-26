<?php

/**
 * @file
 * Page callback file for the HBS Homepage module.
 */

/**
 * Menu callback; displays a mostly blank page for the inclusion of contexts for the homepage.
 */
function hbs_homepage_homepage() {
  $build = array();

  $block = module_invoke('search', 'block_view', 'search');
  $build['search'] = $block;

  // Display the main map dashboard.
  //$build['map'] = _hbs_homepage_main_map();

  // Display the main map stories items.
  $build['stories'] = _hbs_homepage_stories();

  // Display blog post in jumbotron.
  $build['jumbotron'] = _hbs_homepage_jumbotron();

  // Get the About Us node teaser.
  $build['about'] = _hbs_homepage_about();

  // Get the most resources that have been promoted to the homepage.
  $build['resources'] = _hbs_homepage_resources();

  // Get the most recent blog posts that have been promoted to the homepage.
  $build['blogs'] = _hbs_homepage_blogs();

  // Build a list of cluster links
  $build['clusters'] = _hbs_homepage_clusters();

  $build['story_count'] = ( isset($build['stories']['nodes']) )? count($build['stories']['nodes'])-1 : 0;
  // Class for 5 story layout
  $build['stories_class'] = $build['story_count'] == 5? 'fivecolumns': '';

  if($build['story_count']) $span = ' col-sm-' . round( 12 / $build['story_count']  );
  $build['stories_footer_classes'] = array();
  for($i =0; $i < $build['story_count'] ; $i++){
    $build['stories_footer_classes'][] = 'step-footer story-' . $i . $span;
  }

  drupal_add_css(drupal_get_path('module', 'hbs_homepage') . '/css/homepage.css');
  drupal_add_js(array('hbs_dashboard' => $hbs_dashboard ), 'setting');

  return theme('hbs_homepage_template', $build);
}


/**
 * Helper function to get list for promoted map stories that
 * have been promoted to the front page.
 *
 * @return array Render array of story nodes.
 */
function _hbs_homepage_stories() {
  $count = variable_get('hbs_homepage_stories_limit', 4);
  $count = $count > 6  ? 6 : $count;
  $query = db_select('node', 'n')->extend('PagerDefault');
  $query = $query
    ->fields('n', array('nid', 'sticky', 'created'))
    ->condition('type', 'story')
    ->condition('status', 1);
  if (variable_get('hbs_homepage_stories_only_promoted', TRUE)) $query->condition('promote', 1);
  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit($count)
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $story_nodes = array();
  $story_map_data = array();
  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    $story_nodes = node_view_multiple($nodes);
    $story_count = 0;
    foreach ($story_nodes['nodes'] as $key => $node) {
      if (is_array($node)) {
        unset($story_nodes['nodes'][$key]['links']);
        $story_nodes['nodes'][$key]['#count'] = $count;

        $node_entity_wrapper = entity_metadata_wrapper('node', $node['#node']);

        // Have to use try/catch block since $entity_wrapper->__isset('field_name') returns true even for empty fields
        try {
          // Checking to make sure all the necessary fields for the story homepage map are set
          if($node_entity_wrapper->__isset('title') 
            && $node_entity_wrapper->__isset('body') 
            && $node_entity_wrapper->__isset('field_story_region_type') 
            && $node_entity_wrapper->__isset('field_story_map_key') 
            && $node_entity_wrapper->__isset('field_story_year')
            ) {

            $image = NULL;
            if ($node_entity_wrapper->__isset('field_story_image')) {
              $image = $node_entity_wrapper->field_story_image->value();
              if ($image) {
                $image = file_create_url($image['uri']);
              }
            }
            $url = NULL;
            if ($node_entity_wrapper->__isset('field_story_url')) {
              $url = $node_entity_wrapper->field_story_url->value();
            }

            if (isset($node['body']['#object']->field_story_cluster)) {
              $field_cluster = $node['body']['#object']->field_story_cluster;
              if(isset($field_cluster[LANGUAGE_NONE])) {
                $solr_cluster = $field_cluster[LANGUAGE_NONE][0];
                $solr_id = explode('/', $solr_cluster['solr_id']);
                $cluster = $solr_id[1];
                $subcluster = 'all';
                if (count($solr_id) > 2) {
                  $subcluster = $solr_id[2];
                }
              }
            }

            $story_map_data[$story_count] = array(
              'id' => $key,
              'headline' => $node_entity_wrapper->title->value(),
              'abstract' => $node_entity_wrapper->body->value->value(),
              'image' => $image,
              'url' => $url,
              'map' => array(
                'region_type' => $node_entity_wrapper->field_story_region_type->value(),
                'map_key' => $node_entity_wrapper->field_story_map_key->value(),
                'cluster' => $cluster,
                'subcluster' => $subcluster
              )
            );

            if (isset($node['body']['#object']->field_story_highlighted_areas)) {
              $highlights = array();
              $field_cluster = $node['body']['#object']->field_story_highlighted_areas;
              if(isset($field_cluster[LANGUAGE_NONE])) {
                foreach ($field_cluster[LANGUAGE_NONE] as $region) {
                  $solr_id = explode('/', $region['solr_id']);
                  $highlights[] = $solr_id[2];
                }
                $story_map_data[$story_count]['map']['highlight'] = $highlights;
              }
            }

            if($node_entity_wrapper->field_story_year->__isset('value2')) {
              $year = $node_entity_wrapper->field_story_year->value2->value();
              $story_map_data[$story_count]['map']['year'] = intval(date('Y', $year));

              if($node_entity_wrapper->field_story_year->__isset('value')) {
                $start = $node_entity_wrapper->field_story_year->value->value();
                if($start != $year) $story_map_data[$story_count]['map']['start'] = intval(date('Y', $start));
              }            
            }

            $story_count++;
          }
        }
        catch(Exception $e) { }
      }
    }
  }

  drupal_add_js(array('hbs_homepage' => array('story_map_data' => $story_map_data)), 'setting');

  return $story_nodes;
}

/**
 * Helper function to get blog that
 * has been promoted to the front page jumbotron.
 *
 * @return array Render array of blog node.
 */
function _hbs_homepage_jumbotron() {

  $query = db_select('node', 'n')->extend('PagerDefault');
  $query->join('field_data_field_super_promote', 'p', 'p.entity_id = n.nid');
  $query = $query
    ->fields('n', array('nid', 'sticky', 'created'))
    ->fields('p', array('field_super_promote_value'))
    ->condition('type', 'blog')
    ->condition('status', 1)
    ->condition('field_super_promote_value', '1');

  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(1)
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $blog_nodes = array();
  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    $blog_nodes = node_view_multiple($nodes);
    foreach ($blog_nodes['nodes'] as $key => $node) {
      if (is_array($node)) {
        unset($blog_nodes['nodes'][$key]['links']);
        $blog_nodes['nodes'][$key]['#jumbotron'] = 1;
      }

    }
  }
  return $blog_nodes;
}

/**
 * Helper function to get links list for the latest blogs that
 * have been promoted to the front page.
 *
 * @return array Render array of blog nodes.
 */
function _hbs_homepage_blogs() {
  $query = db_select('node', 'n')->extend('PagerDefault');
  $query = $query
    ->fields('n', array('nid', 'sticky', 'created'))
    ->condition('type', 'blog')
    ->condition('status', 1);
  if (variable_get('hbs_homepage_blogs_only_promoted', TRUE)) $query->condition('promote', 1);
  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(variable_get('hbs_homepage_blogs_limit', 3))
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $blog_nodes = array();
  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);

    $blog_nodes= array(
      '#theme' => 'item_list',
      '#items' => array_filter(reset(node_view_multiple($nodes)),
        function(&$node) {
          if (!is_array($node))return false;
          $node = drupal_render($node);
          return true;
        })
      );
  }

  return $blog_nodes;
}

/**
 * Helper function to get links for the latest resources that
 * have been promoted to the front page.
 *
 * @return array Render array of blog nodes.
 */
function _hbs_homepage_resources() {
  $query = db_select('node', 'n')->extend('PagerDefault');
  $query = $query
    ->fields('n', array('nid', 'sticky', 'created'))
    ->condition('type', 'resource')
    ->condition('status', 1);
  if (variable_get('hbs_homepage_resources_only_promoted', FALSE)) $query->condition('promote', 1);
  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->limit(variable_get('hbs_homepage_resources_limit', 3))
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  $resource_nodes = array();
  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);

    $resource_nodes= array(
      '#theme' => 'item_list',
      '#items' => array_filter(reset(node_view_multiple($nodes)),
        function(&$node) {
          if (!is_array($node))return false;
          $node = drupal_render($node);
          return true;
        })
      );
  }

  return $resource_nodes;
}

/**
 * Helper function to get the teaser for the About Use page.
 *
 * @return array Render array of a page node.
 */
function _hbs_homepage_about() {
  $tid = variable_get('hbs_homepage_about_tid', 1);

  $term = taxonomy_term_load($tid);
  if (!empty($term)) {
    return theme('hbs_homepage_about_block', array('term' => $term));
  }
  else {
    $nid = variable_get('hbs_homepage_about_nid', FALSE);
    if ($nid) {
      // Even though there's only a single node here, we treat it like
      // multiples so that Drupal will give us a teaser view of it.
      $node = node_load_multiple(array($nid));
      $about_node = node_view_multiple($node);
      return $about_node['nodes'];
    }
  }

  return NULL;
}

/**
 * Helper function to get the teaser for the About Use page.
 *
 * @return array Render array of a page node.
 */
function _hbs_homepage_main_map() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  drupal_add_js(
      array(
        'hbs_map' => array(
          'play_carousel' => true,
          'show_chart' => true,
          'is_homepage' => true
        )
      ),
      'setting'
    );
  return $block['content'];
}

/**
 * Helper function to get the teaser for the About Use page.
 *
 * @return array Render array of a page node.
 */
function _hbs_homepage_clusters() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_clustergrid');
  return $block['content'];
}

/**
* Page callback: Current posts settings
*
* @see hbs_homepage_menu()
*/
function hbs_homepage_config_form($form, &$form_state) {
  $form['hbs_homepage_stories_limit'] = array(
    '#type' => 'textfield',
    '#title' => t('Maximum number of map stories'),
    '#default_value' => variable_get('hbs_homepage_stories_limit', 4),
    '#size' => 1,
    '#maxlength' => 1,
    '#description' => t('The maximum number of stories to display with the map on the homepage. This will only include stories posts that have been promoted to the front page. A limit of 6 stories is allowed.'),
  );
  $form['hbs_homepage_stories_only_promoted'] = array(
    '#type' => 'checkbox',
    '#title' => t('Limit to only promoted stories'),
    '#default_value' => variable_get('hbs_homepage_stories_only_promoted', TRUE),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('If checked, only stories that have been selected to be "Promote to Front Page" will display on the homepage. Otherwise, the homepage will display the most recent stories.'),
  );
  $form['hbs_homepage_blogs_limit'] = array(
    '#type' => 'textfield',
    '#title' => t('Maximum number of blog posts'),
    '#default_value' => variable_get('hbs_homepage_blogs_limit', 3),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('The maximum number of blog posts to display on the homepage. This will only onclude blog posts that have been promoted to the front page.'),
  );
  $form['hbs_homepage_blogs_only_promoted'] = array(
    '#type' => 'checkbox',
    '#title' => t('Limit to only promoted blog posts'),
    '#default_value' => variable_get('hbs_homepage_blogs_only_promoted', TRUE),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('If checked, only blog posts that have been selected to be "Promote to Front Page" will display on the homepage. Otherwise, the homepage will display the most recent blog posts.'),
  );
  $form['hbs_homepage_resources_limit'] = array(
    '#type' => 'textfield',
    '#title' => t('Maximum number of resources'),
    '#default_value' => variable_get('hbs_homepage_resources_limit', 3),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('The maximum number of resource items to display on the homepage. This will only onclude resources that have been promoted to the front page.'),
  );
  $form['hbs_homepage_resources_only_promoted'] = array(
    '#type' => 'checkbox',
    '#title' => t('Limit to only promoted resources'),
    '#default_value' => variable_get('hbs_homepage_resources_only_promoted', TRUE),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t('If checked, only resources that have been selected to be "Promote to Front Page" will display on the homepage. Otherwise, the homepage will display the most recent resources.'),
  );
  $form['hbs_homepage_about_tid'] = array(
    '#type' => 'textfield',
    '#title' => t('Term ID of the "About Us" section'),
    '#default_value' => variable_get('hbs_homepage_about_tid', 1),
    '#size' => 2,
    '#maxlength' => 10,
    '#description' => t('The term ID of the "About Us" section.'),
  );
  $form['hbs_homepage_welcome_nid'] = array(
    '#type' => 'textfield',
    '#title' => t('Node ID of the Welcome message'),
    '#default_value' => variable_get('hbs_homepage_welcome_nid', FALSE),
    '#size' => 2,
    '#maxlength' => 10,
    '#description' => t('The node ID of the page to use to display the Welcome message.'),
  );


  $form['hbs_homepage_first_lead'] = array(
    '#type' => 'fieldset',
    '#title' => 'First Homepage Lead',
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#description' => "Messages that appears under the map on the homepage.",
  );

  $form['hbs_homepage_first_lead']['hbs_homepage_first_lead_title'] = array(
    '#type' => 'textfield',
    '#title' => t('Lead Title'),
    '#default_value' => variable_get('hbs_homepage_first_lead_title', FALSE),
    '#size' => 62,
    '#maxlength' => 128,
    '#description' => t('Header for the lead'),
  );

  $lead_message1 = variable_get('hbs_homepage_first_lead_messages', NULL);
  $form['hbs_homepage_first_lead']['hbs_homepage_first_lead_messages'] = array(
    '#type' => 'text_format',
    '#base_type' => 'textarea',
    '#title' => 'Lead Message',
    '#description' => 'This HTML block will appear under the map on the homepage.',
    '#default_value' => ($lead_message1) ? $lead_message1['value'] : NULL,
    '#format' => ($lead_message1) ? $lead_message1['format'] : NULL,
  );

  $form['hbs_homepage_second_lead'] = array(
    '#type' => 'fieldset',
    '#title' => 'Second Homepage Lead',
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#description' => "Messages that appears under the first lead on the homepage.",
  );

  $form['hbs_homepage_second_lead']['hbs_homepage_second_lead_title'] = array(
    '#type' => 'textfield',
    '#title' => t('Lead Title'),
    '#default_value' => variable_get('hbs_homepage_second_lead_title', FALSE),
    '#size' => 62,
    '#maxlength' => 128,
    '#description' => t('Header for the lead'),
  );

  $lead_message2 = variable_get('hbs_homepage_second_lead_messages', NULL);
  $form['hbs_homepage_second_lead']['hbs_homepage_second_lead_messages'] = array(
    '#type' => 'text_format',
    '#base_type' => 'textarea',
    '#title' => 'Lead Message',
    '#description' => 'This HTML block will appear under the first lead on the homepage.',
    '#default_value' => ($lead_message2) ? $lead_message2['value'] : NULL,
    '#format' => ($lead_message2) ? $lead_message2['format'] : NULL,
  );

  $form['hbs_homepage_third_lead'] = array(
    '#type' => 'fieldset',
    '#title' => 'Third Homepage Lead',
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#description' => "Messages that appears under the map on the homepage.",
  );

  $form['hbs_homepage_third_lead']['hbs_homepage_third_lead_title'] = array(
    '#type' => 'textfield',
    '#title' => t('Lead Title'),
    '#default_value' => variable_get('hbs_homepage_third_lead_title', FALSE),
    '#size' => 62,
    '#maxlength' => 128,
    '#description' => t('Header for the lead'),
  );

  $lead_message3 = variable_get('hbs_homepage_third_lead_messages', NULL);
  $form['hbs_homepage_third_lead']['hbs_homepage_third_lead_messages'] = array(
    '#type' => 'text_format',
    '#base_type' => 'textarea',
    '#title' => 'Lead Message',
    '#description' => 'This HTML block will appear under the map on the homepage.',
    '#default_value' => ($lead_message3) ? $lead_message3['value'] : NULL,
    '#format' => ($lead_message3) ? $lead_message3['format'] : NULL,
  );

  $welcome_message = variable_get('hbs_homepage_welcome_message', _hbs_homepage_welcome_message_default());
  $form['hbs_homepage_welcome_message'] = array(
    '#type' => 'text_format',
    '#base_type' => 'textarea',
    '#title' => 'Homepage welcome drop-down',
    '#default_value' => ($welcome_message) ? $welcome_message['value'] : NULL,
    '#format' => ($welcome_message) ? $welcome_message['format'] : NULL,
    '#description' => "The welcome message displayed for first-time users or when a user clicks the Welcome link in the top navigation.",
    '#weight' => 10,
  );

  return system_settings_form($form);
}

/**
 * Helper function to load the appropriate welcome message
 * from a predetermined node.
 * @return  string  Themed node view of the welcome node's content.
 */
function _hbs_homepage_welcome_message() {
  $welcome_message = variable_get('hbs_homepage_welcome_message', _hbs_homepage_welcome_message_default());
  $welcome_message = (!empty($welcome_message) && !empty($welcome_message['value'])) ? $welcome_message : _hbs_homepage_welcome_message_default();

  $welcome_nid = variable_get('hbs_homepage_welcome_nid', FALSE);

  if ($welcome_message) {
    $welcome_message['#markup'] = $welcome_message['value'];
    return theme('hbs_homepage_welcome', array('node' => $welcome_message));
  }
  elseif ($welcome_nid) {
    $node = node_view(node_load($welcome_nid), 'full');
    return theme('hbs_homepage_welcome', array('node' => $node));
  }
  else {
    return theme('hbs_homepage_welcome_default');
  }
}
