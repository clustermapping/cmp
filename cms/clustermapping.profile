<?php

/**
 * Implements hook_install().
 */
function clustermapping_install() {
  // Set initial profile settings
  variable_set('site_default_country', 'US');
  variable_set('date_default_timezone', 'America/New_York');

  // Set default theme
  variable_set('theme_default', 'clustermapping'); // TODO: Change this to the Clustermapping theme when ready

  // Set default admin theme to Ember and enable options
  variable_set('admin_theme', 'ember');
  variable_set('node_admin_theme', TRUE);

  // Set jQuery Update version to play nice with Chosen, Ember, and other things we'll want to use
  variable_set('jquery_update_jquery_version', '1.7');
  variable_set('jquery_update_compression_type', 'min');
  variable_set('jquery_update_jquery_cdn', 'none');

  // Set Chosen settings
  variable_set('chosen_minimum', 0);
  variable_set('chosen_minimum_multiple', 'Always Apply');
  variable_set('chosen_search_contains', TRUE);

  // Add text formats.
  $filtered_html_format = array(
    'format' => 'filtered_html',
    'name' => 'Filtered HTML',
    'weight' => 0,
    'filters' => array(
      // URL filter.
      'filter_url' => array(
        'weight' => 0,
        'status' => 1,
      ),
      // HTML filter.
      'filter_html' => array(
        'weight' => 1,
        'status' => 1,
      ),
      // Line break filter.
      'filter_autop' => array(
        'weight' => 2,
        'status' => 1,
      ),
      // HTML corrector filter.
      'filter_htmlcorrector' => array(
        'weight' => 10,
        'status' => 1,
      ),
    ),
  );
  $filtered_html_format = (object) $filtered_html_format;
  filter_format_save($filtered_html_format);

  $full_html_format = array(
    'format' => 'full_html',
    'name' => 'Full HTML',
    'weight' => 1,
    'filters' => array(
      // URL filter.
      'filter_url' => array(
        'weight' => 0,
        'status' => 1,
      ),
      // Line break filter.
      'filter_autop' => array(
        'weight' => 1,
        'status' => 1,
      ),
      // HTML corrector filter.
      'filter_htmlcorrector' => array(
        'weight' => 10,
        'status' => 1,
      ),
    ),
  );
  $full_html_format = (object) $full_html_format;
  filter_format_save($full_html_format);

  // Insert default pre-defined node types into the database. For a complete
  // list of available node type attributes, refer to the node type API
  // documentation at: http://api.drupal.org/api/HEAD/function/hook_node_info.
  $types = array(
    array(
      'type' => 'page',
      'name' => st('Basic page'),
      'base' => 'node_content',
      'description' => st("Use <em>basic pages</em> for your static content, such as an 'About us' page."),
      'custom' => 1,
      'modified' => 1,
      'locked' => 0,
    ),
  );

  foreach ($types as $type) {
    $type = node_type_set_defaults($type);
    node_type_save($type);
    node_add_body_field($type);
  }

  // Default "Basic page" to not be promoted and have comments disabled.
  variable_set('node_options_page', array('status'));
  variable_set('comment_page', 0);

  // Don't display date and author information for "Basic page" nodes by default.
  variable_set('node_submitted_page', FALSE);

  // Enable default permissions for system roles.
  $filtered_html_permission = filter_permission_name($filtered_html_format);
  user_role_grant_permissions(DRUPAL_ANONYMOUS_RID, array('access content', $filtered_html_permission));
  user_role_grant_permissions(DRUPAL_AUTHENTICATED_RID, array('access content', $filtered_html_permission));

  // Create a default role for site administrators, with all available permissions assigned.
  $admin_role = new stdClass();
  $admin_role->name = 'administrator';
  $admin_role->weight = 2;
  user_role_save($admin_role);
  user_role_grant_permissions($admin_role->rid, array_keys(module_invoke_all('permission')));
  // Set this as the administrator role.
  variable_set('user_admin_role', $admin_role->rid);

  // Assign user 1 the "administrator" role.
  db_insert('users_roles')
    ->fields(array('uid' => 1, 'rid' => $admin_role->rid))
    ->execute();

  // Create a Home link in the main menu.
  $item = array(
    'link_title' => st('Home'),
    'link_path' => '<front>',
    'menu_name' => 'main-menu',
  );
  menu_link_save($item);

  // Update the menu router information.
  menu_rebuild();
}

/**
 * Enable our data_admin module and grant perms
 */
function clustermapping_update_7001() {
  module_enable(array('hbs_data_admin'));

  $admin_role = variable_get('user_admin_role', false);

  if ($admin_role !== false) {
    user_role_grant_permissions($admin_role->rid, array('manage hbs data'));
  }
}

/**
 * Enable the homepage module
 */
function clustermapping_update_7002() {
  module_enable(array('hbs_homepage'));
}

/**
 * Enable the navigation module
 */
function clustermapping_update_7003() {
  module_enable(array('hbs_navigation'));
}

/**
 * Ensure all project modules are enabled and default variables are set
 */
function clustermapping_update_7004() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());

  // Set some default values
  variable_set('hbs_homepage_blogs_only_promoted', FALSE);
  variable_set('hbs_homepage_blogs_limit', 2);
  variable_set('hbs_homepage_resources_only_promoted', FALSE);
  variable_set('hbs_homepage_resources_limit', 2);

  // Anonymous role is always 1
  user_role_grant_permissions(1, array('search content'));

  drupal_flush_all_caches();
}

/**
 * Helper function to get a list of all available modules according to this profile.
 */
function _clustermapping_module_list() {
  $profile = drupal_get_profile();
  $info = drupal_parse_info_file("profiles/$profile/$profile.info");
  return $info['dependencies'];
}

function hook_update_dependencies() {
  module_enable(_clustermapping_module_list());
  return NULL;
}

/**
 * Enable all modules within the profile.
 */
function clustermapping_update_7005() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable all modules within the profile.
 */
function clustermapping_update_7006() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable all modules within the profile.
 */
function clustermapping_update_7007() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable all modules within the profile.
 */
function clustermapping_update_7008() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Add the site slogan system variable, and enable all modules within the profile.
 */
function clustermapping_update_7009() {
  variable_set('site_slogan', 'Powerful tools for economic development');
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

function clustermapping_update_7010() {
  global $base_url;
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());

  db_update('apachesolr_environment')
    ->fields(
      array('env_id' => 'solr',
        'name' => 'Clustermapping.us solr server',
        'url' => $base_url . '/solr'
      )
    )
    ->condition('env_id', 'solr')
    ->execute();
}

/**
 * Enable all modules within the profile.
 */
function clustermapping_update_7011() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Disable the Contact module
 */
function clustermapping_update_7012() {
  module_disable(array('contact'));
}


/**
 * Enable the new dashboard features module.
 */
function clustermapping_update_7013() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable the new Views Data Export module.
 */
function clustermapping_update_7014() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}


/**
 * Enable the new Views Data Export module.
 */
function clustermapping_update_7015() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable the new Views Data Export module.
 */
function clustermapping_update_7016() {
    // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}
function clustermapping_update_7017() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
  variable_set('googleanalytics_account', 'UA-27818693-1');
}

/**
 * Enable hbs_user module.
 */
function clustermapping_update_7018() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable hbs_user module.
 */
function clustermapping_update_7019() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}

/**
 * Enable geocoder and geophp module.
 */
function clustermapping_update_7020() {
  // Ensure that all modules are enabled for this profile
  module_enable(_clustermapping_module_list());
}
