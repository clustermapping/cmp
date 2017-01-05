<?php

function _hbs_dashboard_comparison_page_callback($code = NULL) {
  global $user;
  $build = array();

  $args = func_get_args();
  $code = array_shift($args);

  if (! $user->uid) {
    $build['user_login_block'] = drupal_get_form('user_login_block');
    return theme('hbs_comparison_template', $build);
  }

  if ($code == 'new') {
    call_user_func_array('_hbs_dashboard_comparison_new_callback', $args);
    return;
  }

  if ($code) {
    $_SESSION['region_compare'] = _hbs_dashboard_comparison_load($code);
  
  } else if (!isset($_SESSION['region_compare'])) {
    $_SESSION['region_compare'] = array('name' => 'New Comparison');
  }

  drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');
  drupal_add_js(hbs_viz_get_js_path('d3') . '/d3.min.js', 'file');
  drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_compare.js', 'file');
  $hash = quick_search_callback_set('hbs_comparison_autocomplete_qs_callback');

  drupal_add_js(array( 'quick_search' => array(
      'region-compare-input-regions' => array(
        'path' => base_path() . "quick_search_compare/$hash/autocomplete",
        'minlength' => 1,
        'username' => $user->name,
      ),
  )), 'setting');

  $meta = _hbs_load_meta();

  $cluster_data = array();
  foreach ($meta['clusters'] as $cluster) {
    if (! $cluster['subcluster_b'] && $cluster['traded_b']) {
      $cluster_data[$cluster['name_t']] = array('name' => $cluster['name_t'], 'key' => $cluster['key_t']);
    }
  }
  ksort($cluster_data);
  $_SESSION['region_compare']['cluster_data'] = array_values($cluster_data);

  $indicator_data = array();
  $indicators = array();
  $valid_indicators = array(
    'gdp_per_capita_tf',
    'private_wage_tf',
    'real_per_capita_personal_income_chained_2008_dollars_tf',
    'labor_mobilization_tf',
    'emp_tl',
    'unemployment_rate_tf',
    'poverty_rate_tf',
    'labor_force_productivity_tf',
    'innovation_tf',
    'est_tl',
    'exports_tf',
    'bea_foreign_employment_by_state_industry__all_industries_tf',
    'rd_per_capita_tf',
    'federal_rd_per_capita_tf',
    'venture_capital_per_gdp_tf',
    'scientific_degrees_tf',
    'advanced_scientific_workers_tf',
    'educational_attainment_25_years_and_over_high_school_graduate_per_tf',
    'educational_attainment_25_years_and_over_some_college_or_associates_per_tf',
    'educational_attainment_25_years_and_over_bachelors_per_tf',
    'unionization_rate_tf',
    'taxes_per_gdp_tf',
    'corp_taxes_per_gdp_tf',
    'str_emp_per_tf',
    'manufacturing_intensity_tf',
    'personal_consumption_expenditures_per_capita_tf',
    'population_by_age_ages_0_to_4_preschool_per_tf',
    'population_by_age_ages_5_to_17_school_age_per_tf',
    'population_by_age_ages_18_to_24_college_age_per_tf',
    'population_by_age_ages_25_to_44_young_adult_per_tf',
    'population_by_age_45_to_64_older_adult_per_tf',
    'population_by_age_age_65_and_older_older_per_tf',
    'total_population_gr',
    'young_adult_population_gr',
    'population_density_tf',
    'net_international_migration_per_tf',
    'net_domestic_migration_per_tf',
    'agricultural_output_gdp_tf',
    'gov_employment_local_services_tf',
    'gov_employment_federal_services_tf',
    'gov_employment_higher_education_tf',
    'gov_employment_health_hospitals_tf',
    'military_payroll_per_capita_tf',
    'avg_firm_size_tf',
    'fortune1000_tl',
  );

  foreach ($meta['dict']['vars'] as $var) {
    if (! in_array($var['label'], $indicator_data) && in_array($var['key'], $valid_indicators)) {
      $indicator_data[$var['label']] = array('name' => $var['label'], 'key' => $var['key']);
      if (in_array($var['key'], $_SESSION['region_compare']['indicators'])) {
        $indicators[$var['key']] = $var['label'];
      }
    }
  }
  ksort($indicator_data);
  $_SESSION['region_compare']['indicator_data'] = array_values($indicator_data);

  drupal_add_js(array( 'hbs_region_compare' => $_SESSION['region_compare']), 'setting');
  $build['menu_add_content'] = menu_tree('menu-add-content');
  $build['name'] = $_SESSION['region_compare']['name'];
  $build['code'] = $_SESSION['region_compare']['code'];
  $build['regions'] = $_SESSION['region_compare']['region_data'];
  $build['indicators'] = $indicators;
  $build['indicator_data'] = $indicator_data;

  return theme('hbs_comparison_template', $build);
}

function _hbs_dashboard_comparison_load($code) {
  global $base_url, $user;
  $api_base_url = variable_get('hbs_dashboard_api_base_url', $base_url);
  $alias = drupal_get_path_alias('user/' . $user->uid);
  $alias = str_replace('users/', '', $alias);  
  $result = drupal_http_request($api_base_url . '/data/report/region/compare/' . $code);
  $data = json_decode($result->data, TRUE);
  $data['name'] = str_replace(' by ' . $alias, '', $data['name']);
  return $data;
}

function _hbs_dashboard_comparison_save_callback() {
  global $user;
    $data = array(
      'code' => $_POST['code'],
      'name' => $_POST['name'],
      'regions' => $_POST['regions'],
      'clusters' => $_POST['clusters'],
      'indicators' => $_POST['indicators'],
      'owner' => $user->name,
      'saved' => ($_POST['name'] == 'New Comparison')
    );
  $result = _hbs_dashboard_comparison_save($data);
  if ($result['code'] != $data['code']) {
    _hbs_dashboard_comparison_delete($data['code']);
  }
  header('Content-Type: application/json');
  echo json_encode($result);
}

function _hbs_dashboard_comparison_save($data) {
  global $base_url, $user;
  $api_base_url = variable_get('hbs_dashboard_api_base_url', $base_url);
  $result = drupal_http_request($api_base_url . '/data/compare', array(
      'headers' => array( 'Content-Type' => 'application/json'),
      'method' => 'POST',
      'data' => json_encode($data)
    ));
  return json_decode($result->data, TRUE);
}

function _hbs_dashboard_comparison_delete($code) {
  global $base_url, $user;
  $api_base_url = variable_get('hbs_dashboard_api_base_url', $base_url);
  $data = array( 'code' => $code, 'owner' => $user->name);
  $result = drupal_http_request($api_base_url . '/data/compare/delete', array(
      'headers' => array( 'Content-Type' => 'application/json'),
      'method' => 'POST',
      'data' => json_encode($data)
    ));
  return json_decode($result->data, TRUE);
}

function _hbs_dashboard_comparison_new_callback($type1 = NULL, $code1 = NULL, $type2 = NULL, $code2 = NULL) {
  global $user;
  unset($_SESSION['region_compare']);

  $data = array(
    'name' => 'New Comparison', 
    'regions' => array(), 
    'code' => 'new_comparison',
    'clusters' => array('apparel', 'automotive', 'biopharmaceuticals', 'business_services', 'distribution_and_electronic_commerce'),
    'indicators' => array('gdp_per_capita_tf', 'emp_tl', 'private_wage_tf', 'unemployment_rate_tf'),
    'owner' => $user->name,
    'saved' => false
  );

  if ($type1 && $code1) {
    $id = 'region/' . $type1 . '/' . $code1;
    if (!in_array($id, $data['regions'])) {
      $data['regions'][] = $id;
    }
  }
  if ($type2 && $code2) {
    $id = 'region/' . $type2 . '/' . $code2;
    if (!in_array($id, $data['regions'])) {
      $data['regions'][] = $id;
    }
  }

  $_SESSION['region_compare'] = _hbs_dashboard_comparison_save($data);
  drupal_goto('compare/' . $_SESSION['region_compare']['code']);
}

function _hbs_dashboard_comparison_delete_callback($type = NULL, $code = NULL) {
  if ($_SESSION['region_compare']['code'] && $type && $code) {
    $id = 'region/' . $type . '/' . $code;
    $regions = array();
    foreach ($_SESSION['region_compare']['regions'] as $i => $region) {
      if ($id != $region) {
        $regions[] = $_SESSION['region_compare']['regions'][$i];
      }
    }
    $_SESSION['region_compare']['regions'] = $regions;
    unset($_SESSION['region_compare']['region_data']);
    _hbs_dashboard_comparison_save($_SESSION['region_compare']);
  }
  drupal_goto('compare/' . $_SESSION['region_compare']['code']);
}

function _hbs_load_meta() {
    global $base_url;
    $api_base_url = variable_get('hbs_dashboard_api_base_url', $base_url);
    $result = drupal_http_request($api_base_url . '/data/meta');
    $data = json_decode($result->data, TRUE);
    return $data;
}
