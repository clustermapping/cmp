<?php

function hbs_dashboard_admin_page() {
  $form = array();

  // Set up the collapsible fieldsets for each message type
  $pages = array('cluster' => 'Clusters', 'region' => 'Regions',  'region_cluster' => 'Regions-cluster', 'organization' => 'Organizations');
  $subpages = array(
    'cluster' => array(
      'landing'       => 'Landing Page',
      'summary'       => 'Summary',
      'topregions'    => 'Top Regions',
      'subclusters'   => 'Subclusters',
      'subcluster_summary'   => 'Subcluster Summary',
      'organization'  => 'Organizations',
    ),
    'region' => array(
      'landing'       => 'Landing Page',
      'summary'       => 'Summary',
      'performance'   => 'Performance & Drivers',
      'regioncluster' => "Cluster Portfolio",
      'subregion'     => 'Sub-Regions',
      'organization'  => 'Organizations',
      'region_builder'  => 'Custom Region Builder',
    ),
    'region_cluster' => array(
      'summary'       => 'Summary',
      'subregion'     => 'Sub-Regions',
      'subclusters'   => 'Subclusters',
    ),
    'organization' => array(
      'summary'       => 'Landing Page',
    ),
  );
  $messages = array(
    'cluster' => array(
      'landing' => array(
        'cluster_landing_top'                     => 'Top of page',
      ),
      'summary' => array(
        'cluster_summary_top'                     => 'Top of page',
        'cluster_summary_topregions'              => 'Top Regions',
        'cluster_summary_subclusters'             => 'Sub Clusters',
        'cluster_summary_related'                 => 'Related Clusters',
      ),
      'topregions' => array(
        'cluster_topregions_top'                  => 'Top of page',
        'cluster_topregions_regions'              => 'Regions',
      ),
      'subclusters' => array(
        'cluster_subclusters_top'                 => 'Top of page',
        'cluster_subclusters_compositiondetails'  => 'Subclusters (Cluster Composition Details)',
      ),
      'subcluster_summary' => array(
        'cluster_subcluster_summary_top'                 => 'Top of page',
      ),
    ),
    'region' => array(
      'landing' => array(
        'region_landing_top'            => 'Top of page',
        'region_landing_calltoaction'   => 'Call to Action',
      ),
      'summary' => array(
        'region_summary_top'            => 'Top of page',
        'region_summary_performance'    => 'Performance & Drivers',
        'region_summary_regioncluster'  => 'Cluster Portfolio',
        'region_summary_subregions'     => 'Sub-Regions',
      ),
      'performance' => array(
        'region_performance_top'                => 'Top of page',
        'region_performance_performance'        => 'Performance',
        'region_performance_business'           => 'Business Environment',
        'region_performance_regionalstructure'  => 'Demographics & Geography',
        'region_performance_performance'        => 'Performance',
      ),
      'regioncluster' => array(
        'region_regioncluster_top'              => 'Top of page',
        'region_regioncluster_related'          => 'Related Clusters',
        'region_regioncluster_innovation'       => 'Innovation',
      ),
      'subregion' => array(
        'region_subregion_top'          => 'Top of page',
        'region_subregion_wages'        => 'Sub-Regions Comparative Wage Performance',
        'region_subregion_employment'   => 'Sub-Regions Comparative Employment Performance',
      ),
      'region_builder' => array(
        'region_region_builder_top'              => 'Logged in user message',
        'region_region_builder_top_logged_out'   => 'Anonymous user message',
      ),
    ),
    'region_cluster' => array(
      'summary' => array(
        'region_cluster_summary_top'    => 'Top of page',
        'region_cluster_summar_performance'    => 'Region-Cluster Performance',
        'region_cluster_summary_subclusters'    => 'Subclusters',
      ),
      'subregion' => array(
        'region_cluster_subregion_top'    => 'Top of page',
        'region_cluster_subregion_wages'    => 'Sub-Regional Wages',
        'region_cluster_subregion_employment_performance'    => 'Employment Performance of Sub-Regions',
      ),
      'subclusters' => array(
        'region_cluster_subclusters_top'    => 'Top of page',
        'region_cluster_subclusters_cluster_composition'    => 'Cluster Composition Details',
        'region_cluster_subclusters_subclusters'    => 'Subclusters',
      ),

    ),
    'organization' => array(
      'summary' => array(
        'organization_summary_top'      => 'Top of page',
      ),
    ),
  );


  $count = 0;
  foreach ($pages as $path => $page) {
    $form['hbs_dashboard_messages_' . $path] = array(
      '#type' => 'fieldset',
      '#title' => $page,
      '#weight' => $count++,
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      '#description' => "Messages for the $page pages.",
    );
    if (!empty($subpages[$path])) {
      foreach ($subpages[$path] as $name => $label) {
        $form['hbs_dashboard_messages_' . $path]['hbs_dashboard_messages_' . $name] = array(
          '#type' => 'fieldset',
          '#title' => $label,
          '#weight' => $count++,
          '#collapsible' => TRUE,
          '#collapsed' => TRUE,
          '#description' => "Messages for the $label $page sub-pages",
        );
        if (!empty($messages[$path][$name])) {
          foreach ($messages[$path][$name] as $message_key => $header_label) {
            $message = variable_get('hbs_dashboard_' . $message_key, NULL);
            $form['hbs_dashboard_messages_' . $path]['hbs_dashboard_messages_' . $name]['hbs_dashboard_' . $message_key] = array(
              '#type' => 'text_format',
              '#base_type' => 'textarea',
              '#title' => $header_label,
              '#description' => 'This HTML block will appear under the "' . $header_label . '" header. (message: ' . $message_key . ')',
              '#default_value' => ($message) ? $message['value'] : NULL,
              '#format' => ($message) ? $message['format'] : NULL,
              '#weight' => $count++,
            );
          }
        }
      }
    }
  }


  // Fix some legacy messages...

  // hbs_dashboard_cluster_welcome -> cluster_landing_top
  if (empty($form['hbs_dashboard_messages_cluster']['hbs_dashboard_messages_landing']['hbs_dashboard_cluster_landing_top']['#default_value'])) {
    $message = variable_get('hbs_dashboard_cluster_welcome', NULL);
    $form['hbs_dashboard_messages_cluster']['hbs_dashboard_messages_landing']['hbs_dashboard_cluster_landing_top']['#default_value'] = ($message) ? $message['value'] : NULL;
  }

  // hbs_dashboard_region_welcome -> region_landing_top
  if (empty($form['hbs_dashboard_messages_region']['hbs_dashboard_messages_landing']['hbs_dashboard_region_landing_top']['#default_value'])) {
    $message = variable_get('hbs_dashboard_region_welcome', NULL);
    $form['hbs_dashboard_messages_region']['hbs_dashboard_messages_landing']['hbs_dashboard_region_landing_top']['#default_value'] = ($message) ? $message['value'] : NULL;
  }

  // hbs_dashboard_region_call_to_action -> region_landing_calltoaction
  if (empty($form['hbs_dashboard_messages_region']['hbs_dashboard_messages_landing']['hbs_dashboard_region_landing_calltoaction']['#default_value'])) {
    $message = variable_get('hbs_dashboard_region_call_to_action', NULL);
    $form['hbs_dashboard_messages_region']['hbs_dashboard_messages_landing']['hbs_dashboard_region_landing_calltoaction']['#default_value'] = ($message) ? $message['value'] : NULL;
  }

  // hbs_dashboard_organizations_welcome -> organization_summary_top
  if (empty($form['hbs_dashboard_messages_organization']['hbs_dashboard_messages_summary']['hbs_dashboard_organization_summary_top']['#default_value'])) {
    $message = variable_get('hbs_dashboard_organizations_welcome', NULL);
    $form['hbs_dashboard_messages_organization']['hbs_dashboard_messages_summary']['hbs_dashboard_organization_summary_top']['#default_value'] = ($message) ? $message['value'] : NULL;
  }

  return system_settings_form($form);
}

function hbs_dashboard_tooltip_admin_page() {
  $form = array();

  $form['description'] = array(
    '#markup' => '<p>These are the tool tips (help messages) found throughout the site, and will be comprised of the tool tip\'s title and body text. To place a tool tip somewhere, you\'ll need to know the internal tool tip ID, like "tooltip:3". To place this somewhere, simply put <code>[tooltip:3]</code> where you want the tool tip icon ( i ) to appear.</p><p>"Save configuration" will save changes to all tool tips plus offer a chance to add another.</p>',
    '#weight' => -10,
  );

  $tooltip_count = 1; // Start at 1 since this will be a user-facing counter.

  while ($tip_data = variable_get('hbs_dashboard_tooltip_text_' . $tooltip_count, NULL)) {
    $form['hbs_dashboard_tooltip_' . $tooltip_count] = array(
      '#type' => 'fieldset',
      '#title' => 'Tool Tip ' . $tooltip_count,
      '#weight' => $tooltip_count + 1,
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      '#description' => "This is tool tip [tooltip:$tooltip_count]",
    );
    $form['hbs_dashboard_tooltip_' . $tooltip_count]['hbs_dashboard_tooltip_title_' . $tooltip_count] = array(
      '#type' => 'textfield',
      '#title' => 'Title',
      '#weight' => 1,
      '#default_value' => variable_get('hbs_dashboard_tooltip_title_' . $tooltip_count, NULL),
    );
    $form['hbs_dashboard_tooltip_' . $tooltip_count]['hbs_dashboard_tooltip_text_' . $tooltip_count] = array(
      '#type' => 'textarea',
      '#title' => 'Text',
      '#rows' => 4,
      '#default_value' => NULL,
      '#format' => NULL,
      '#weight' => 2,
      '#default_value' => variable_get('hbs_dashboard_tooltip_text_' . $tooltip_count, NULL),
    );
    $tooltip_count ++;
  }

  $form['hbs_dashboard_tooltip_' . $tooltip_count] = array(
    '#type' => 'fieldset',
    '#title' => 'New Tool Tip',
    '#weight' => $tooltip_count + 1,
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#description' => "This tool tip will be [tooltip:$tooltip_count]",
  );
  $form['hbs_dashboard_tooltip_' . $tooltip_count]['hbs_dashboard_tooltip_title_' . $tooltip_count] = array(
    '#type' => 'textfield',
    '#title' => 'Title',
    '#weight' => 1,
  );
  $form['hbs_dashboard_tooltip_' . $tooltip_count]['hbs_dashboard_tooltip_text_' . $tooltip_count] = array(
    '#type' => 'textarea',
    '#title' => 'Text',
    '#rows' => 4,
    '#default_value' => NULL,
    '#format' => NULL,
    '#weight' => 2,
  );


  return system_settings_form($form);
}

