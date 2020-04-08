<?php

function _hbs_dashboard_chart_helper($chart, $data = NULL) {
  _hbs_dashboard_add_common_js("all", $data);
  $build['chart'] = $chart;
  return theme('hbs_chart_dashboard_template', $build);
}

function _hbs_dashboard_cluster_landing_page_callback() {
  _hbs_dashboard_add_common_js("cluster", NULL);
  drupal_add_js( array( 'hbs_cluster_grid' => array('selected' => array() ) ), 'setting');
  $years = _hbs_load_helper('/data/meta/years');
  drupal_add_js( array( 'hbs_dashboard' => array('years' => $years)), 'setting');
  $year = _hbs_indicator_year('emp_tl', 'all', 'country');
  drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
  $innovation_year = _hbs_indicator_year('patent_count_tf', 'all', 'country');
  drupal_add_js(array('hbs_dashboard' => array('innovation_year' => $innovation_year)), 'setting');
  drupal_add_js(drupal_get_path('module', 'hbs_viz') .'/js/hbs-clusterlist.js', 'file');
  drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_cluster_landing.js', 'file');
  drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');

  return theme('hbs_cluster_landing', array());
}

function _hbs_dashboard_region_landing_page_callback() {
  _hbs_dashboard_add_common_js("all", NULL);
  $build['chart'] = _hbs_dashboard_landing_map();
  $hash = quick_search_callback_set('hbs_search_region_autocomplete_qs_callback');
  $years = _hbs_load_helper('/data/meta/years');
  drupal_add_js(array(
    'quick_search' => array(
      'region-landing-input-regions' => array(
        'path' => base_path() . "quick_search/$hash/autocomplete",
        'minlength' => 1,
      ),
    ),
    'hbs_map' => array(
      'year' => max($years),
    ),
  ), 'setting');
  return theme('hbs_chart_dashboard_template', $build);
}

function _hbs_dashboard_region_builder_page_callback() {
  global $user;

  if ($user->uid) {
    $alias = drupal_get_path_alias('user/' . $user->uid);
    $alias = str_replace('users/', '', $alias);

    $content = array();
    drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');
    $content['#markup'] = '<div class="chart chart-100"><iframe src="/data/viz/builder.html#' . $alias  . '" scrolling="no"></iframe></div>';
    _hbs_dashboard_add_common_js("all", NULL);
    $build['chart'] = $content;
  }
  else {
    $build['chart'] = drupal_get_form('user_login_block');
  }

  return theme('hbs_region_builder', $build);
}

function _hbs_dashboard_add_common_js($type, $data, $tab = NULL) {
  drupal_add_js(hbs_viz_get_js_path('d3') . '/d3.min.js', 'file');
  drupal_add_js(hbs_viz_get_js_path('queue'). '/queue.min.js', 'file');
  drupal_add_css(hbs_viz_get_js_path('mythos-vis') . '/src/style/mythos-vis.css', 'file');
  drupal_add_js(hbs_viz_get_js_path('mythos-vis') . '/dist/mythosvis.js', 'file');
  drupal_add_js(hbs_viz_get_js_path('mythos-vis') . '/src/d3Plot.js', 'file');

  $hbs_dashboard = array('type' => $type, 'data' => $data, 'tab' => $tab);
  drupal_add_js(array('hbs_dashboard' => $hbs_dashboard ), 'setting');
}

function _hbs_dashboard_region_page_callback($region_data = NULL) {
  $data = $region_data ? array( 'region' => $region_data ): array();
  $build = array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    _hbs_dashboard_add_common_js('region', $data);

    if($data['region']['strong_clusters']){
      $selected = array();
      foreach ($data['region']['strong_clusters'] as $key => $value) {
        array_push($selected, $value['code']);
      }
      drupal_add_js( array( 'hbs_cluster_grid' => array('selected' => $selected ) ), 'setting');
    }

    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_dashboard.js', 'file');
    drupal_add_js(drupal_get_path('module', 'hbs_viz') .'/js/hbs-clustergrid.js', 'file');

    $build['region_key'] = $data['region']['region_key_t'];
    $build['region_code'] = $data['region']['region_code_t'];
    $build['region_type'] = $data['region']['region_type_t'];
    $build['map'] = _hbs_dashboard_main_map();
    $build['related'] = _hbs_dashboard_related();
    $build['related_organizations'] = _hbs_dashboard_related_content('organization');
    $build['related_blogs'] = _hbs_dashboard_related_content('blog');
    $build['related_resources'] = _hbs_dashboard_related_content('resource');

    _hbs_dashboard_region_compare($data['region']['region_type_t'], $data['region']['region_code_t']);
    $build['menu_add_content'] = menu_tree('menu-add-content');
    return theme('hbs_region_dashboard_template', $build);
  }
}

function _hbs_dashboard_region_compare($type, $code) {
  $hash = quick_search_callback_set('hbs_comparison_new_autocomplete_qs_callback');
  drupal_add_js(array( 'quick_search' => array(
      'region-compare-input-regions' => array(
        'region' => $type . '/' . $code,
        'path' => base_path() . "quick_search_compare/$hash/autocomplete",
        'minlength' => 1,
      ),
  )), 'setting');
}

function _hbs_dashboard_region_chart_callback($data) {
  $region_type = $data['region_type_t'];
  $region_code = $data['region_code_t'];
  return _hbs_dashboard_chart_helper(_hbs_dashboard_region_scorecard_scatterplot($region_type, $region_code));
}

function _hbs_dashboard_region_jobcreation_callback($data) {
  $chart = array(
    '#markup' => '<div class="hbs-dashboard-jobcreation-barchart"></div>',
    '#attached' => array(
      'js' => array(
        drupal_get_path('module', 'hbs_dashboard') . '/js/hbs_region_jobcreation.js'
      )
    )
  );
  return _hbs_dashboard_chart_helper($chart, $data);
}

function _hbs_dashboard_region_employment_callback($data) {
  $chart = array(
    '#markup' => '<div class="hbs-dashboard-employment-barchart"></div>',
    '#attached' => array(
      'js' => array(
        drupal_get_path('module', 'hbs_dashboard') . '/js/hbs_region_employment.js'
      )
    )
  );
  return _hbs_dashboard_chart_helper($chart, $data);
}

function _hbs_dashboard_region_wages_callback($data) {
    $chart = array(
        '#markup' => '<div class="hbs-dashboard-wages-barchart"></div>',
        '#attached' => array(
            'js' => array(
                drupal_get_path('module', 'hbs_dashboard') . '/js/hbs_region_wages.js'
            )
        )
    );
    return _hbs_dashboard_chart_helper($chart, $data);
}

function _hbs_dashboard_region_scorecard_wages_callback($data) {
    $chart = array(
        '#markup' => '<div class="hbs-dashboard-wages-scorecard-scatterplot"></div>',
        '#attached' => array(
            'js' => array(
                drupal_get_path('module', 'hbs_dashboard') . '/js/hbs_region_wages_scorecard.js'
            )
        )
    );
    return _hbs_dashboard_chart_helper($chart, $data);
}

function _hbs_dashboard_cluster_page_callback($cluster_data = NULL) {
  $data = $cluster_data ? array( 'cluster' => $cluster_data): array();
  $build = array();
  if (empty($data)) {
      return MENU_NOT_FOUND;
  } else {

    $cluster_key = $data['cluster']['key_t'];
    $cluster_code = $data['cluster']['cluster_code_t'];
    $build['cluster_name'] = $data['cluster']['name_t'];
    $hash = quick_search_callback_set('hbs_cluster_autocomplete_qs_callback');
    drupal_add_js(array( 'quick_search' => array(
        'region-cluster-input-regions' => array(
          'path' => base_path() . "quick_search/$hash/cluster/$cluster_key",
          'minlength' => 1,
        ),
    )), 'setting');
    _hbs_dashboard_add_common_js('cluster', $data, 'summary');
    
    $year = _hbs_indicator_year('emp_tl', $cluster_key, 'country');

    $build['map'] = _hbs_dashboard_main_map();
    $build['related'] = _hbs_dashboard_related();
    // $build['topregions_chart'] = '<iframe src="/data/report/cluster/employment#/' . $cluster_key . '/all/'
      // . $year . '/state?subcluster=true&benchmark=false&limit=10&height=460" scrolling="no"></iframe>';
    $build['subcluster_chart'] = '<iframe src="/data/report/region/employment#/country/united_states/'
      . $year . '/' . $cluster_key . '?subcluster=true&benchmark=false" scrolling="no"></iframe>';
    $build['topregions_chart'] = '<iframe src="/data/report/cluster/employment#/' 
      . $cluster_key . '/all/' . $year
      . '/state?subcluster=true&benchmark=false&limit=10&height=460" scrolling="no"></iframe>';
    $build['subcluster_chart'] = '<iframe src="/data/report/region/employment#/country/united_states/'
      . $year . '/' . $cluster_key . '?subcluster=true&benchmark=false" scrolling="no"></iframe>';

    // if (isset($data['cluster']['related_clusters'])) {
    $build['relatedclusters_chart'] = '<iframe src="/data/report/relatedclusters#/'
      . $cluster_code . '" scrolling="no"></iframe>';
    // echo '<pre>'; print_r($build['relatedclusters_chart']);die;
    // }

    $build['related_organizations'] = _hbs_dashboard_related_content('organization');
    $build['related_blogs'] = _hbs_dashboard_related_content('blog');
    $build['related_resources'] = _hbs_dashboard_related_content('resource');
  }
  return theme('hbs_cluster_dashboard_template', $build);
}

function _hbs_dashboard_cluster_grid() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_clustergrid');
  return $block['content'];
}

function _hbs_dashboard_main_map() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  $years = _hbs_load_helper('/data/meta/years');

  drupal_add_js(
    array(
      'hbs_dashboard' => array(
        'play_carousel' => false,
        'show_chart' => false,
        'click_to_region' => true,
        'year' => max($years),
      ),
      'hbs_map' => array(
        'year' => max($years),
      ),
    ),
    'setting'
  );

  drupal_add_js(hbs_viz_get_js_path('topojson'). '/topojson.js');

  return $block['content'];
}

function _hbs_dashboard_landing_map() {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  drupal_add_js(
      array(
        'hbs_map' => array(
          'play_carousel' => false,
          'show_chart' => false
        )
      ),
      'setting'
    );
  return $block['content'];
}

function _hbs_dashboard_region_scorecard($type, $region) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_scorecard');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-scorecard"><div class="scorecard-wrapper"></div></div>';

  drupal_add_js(
    array(
      'hbs_scorecard' => array(
        'dataJson' => '/data/region/' .$type . '/' . $region . '/all'
      )
    ),
    'setting'
  );
  drupal_add_js(drupal_get_path('module', 'hbs_viz') . '/js/utility/d3AlbersUsaPr.js');
  return $block['content'];
}

function _hbs_dashboard_cluster_scorecard($cluster) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_datatable');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-datatable1"><div class="data-table-wrapper"></div></div>';

  drupal_add_js(
    array(
      'hbs_datatable' => array(
        array(
          'dataJson' => '/data/region/state/all/2013/' . $cluster,
          'map' => array(
          array(
              'label' => 'State Name',
              'heading' => true,
              'key' => 'region_name_t',
              'width' => '20%'
          ),
          array(
              'label' => 'Total Emp.',
              'key' => 'emp_tl',
              'width' => '20%',
              'second' => array(
                'label' => 'CAGR 98-11',
                'value' => 'Not Impl.'
              )
          ),
          array(
              'label' => 'National Emp. (%)',
              'key' => 'cluster_emp_per_tf',
              'percent' => true,
              'width' => '25%',
          ),
          array(
              'label' => 'Avg. Wages',
              'key' => 'private_wage_tf',
              'dollar' => true,
              'width' => '20%',
              'second' => array(
                'label' => 'CAGR 98-11',
                'value' => 'Not Impl.'
              )
          ),
          array(
              'label' => 'Location Quotient',
              'key' => 'lq_tf',
              'round' => true,
              'width' => '15%'
          )
          ),
          'delta' => 'hbs-viz-datatable1'
        )
      )
    ),
    'setting'
  );
  return $block['content'];
}


function _hbs_dashboard_structures() {
  // $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  // $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  // return $block['content'];
  return array(
    '#prefix' => '<div class="block-placeholder">',
    '#suffix' => '</div>',
    '#markup' => 'structures block here'
  );
}

function _hbs_dashboard_related_content($type) {
  $argpos = 2;
  $block_id = 'block';

  $args = arg();
  $argkey = implode('/', arg());
  switch (arg(0)) {
    case 'region':
      $regionKey = 'region/' . arg(1) . '/' . arg(2);
      $markup = views_embed_view('related', 'block', $type, $regionKey);
      $markup = str_replace(
        "<a href=\"/related/$type/region/region",
        "<a href=\"/related/$type/region",
        $markup
      );
      break;
    case 'cluster':
      $clusterKey = 'cluster/' . arg(1);
      $block_id = 'block_1';
      $markup = views_embed_view('related', 'block_1', $type, $clusterKey);
      $markup = str_replace(
        "<a href=\"/related/$type/region/cluster",
        "<a href=\"/related/$type/cluster",
        $markup
      );
      break;
    case 'region-cluster':
      $clusterKey = 'cluster/' . arg(1);
      $regionKey = 'region/' . arg(2) . '/' . arg(3);
      array_shift($args);
      $argkey = join('/', $args);
      $markup = views_embed_view('related', 'block_2', $type, $clusterKey, $regionKey);
      $markup = str_replace(
        "<a href=\"/related/$type/region/$clusterKey/$regionKey\">",
        "<a href=\"/related/$type/".join('/', arg())  . "\">",
        $markup
      );
      break;
  }

  $type_names = array(
    'resource' => 'Resources',
    'blog' => 'Blog Posts',
    'organization' => 'Organizations',
  );

  $markup = str_replace(
    '<p>There is no related content.</p>',
    // .main-container .node .field-name-body p
    '<div class="node"><div class="field-name-body"><p>There are no related ' . $type_names[$type] . '.</p></div></div>',
    $markup
  );

  $markup = str_replace(
    'More related content',
    'More related ' . $type_names[$type] . ' &nbsp; <span class="more-arrow"> →</span>',
    $markup
  );

  $markup = str_replace('<div class="more-link">', '<div class="read-more more-link node-readmore">', $markup);

  return array(
    '#prefix' => '<div class="block-placeholder">',
    '#suffix' => '</div>',
    '#markup' => $markup,
  );
}

function _hbs_dashboard_indicators() {
  // $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  // $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  // return $block['content'];
  return array(
    '#prefix' => '<div class="block-placeholder">',
    '#suffix' => '</div>',
    '#markup' => 'indicators block here'
  );
}

function _hbs_dashboard_environment() {
  // $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_map');
  // $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-map"><div class="map-wrapper"></div></div>';
  // return $block['content'];
  return array(
        '#prefix' => '<div class="block-placeholder">',
        '#suffix' => '</div>',
        '#markup' => 'environment block here'
    );
}

function _hbs_dashboard_region_chart($type, $region) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_bar');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-bar"><div class="bar-wrapper"></div></div>';
  drupal_add_js(
    array(
      'hbs_bar' => array(
        'dataJson' => '/data/region/' . $type . '/' . $region . '/2013/all',
        'typeFor' => 'region'
      )
    ),
    'setting'
  );
  return $block['content'];
}

function _hbs_dashboard_subclusters($cluster) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_datatable');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-datatable2"><div class="data-table-wrapper"></div></div>';

  $years = _hbs_load_helper('/data/meta/years');

  drupal_add_js(
    array(
      'hbs_datatable' => array(
        array(
          'dataJson' => '/data/region/country/united_states/' . max($years) . '/' . $cluster . '/all',
          'map' => array(
            array(
                'label' => 'Name',
                'key' => 'sub_name_t',
                'heading' => true,
                'width' => '20%'
            ),
            array(
                'label' => 'Employment',
                'key' => 'emp_tl',
                'width' => '20%',
                'second' => array(
                  'label' => 'Growth Rate',
                  'value' => 'Not Impl.'
                )
            ),
            array(
                'label' => 'Avg. Wage',
                'key' => 'private_wage_tf',
                'dollar' => true,
                'width' => '20%',
                'second' => array(
                  'label' => 'Growth Rate',
                  'value' => 'Not Impl.'
                )
            ),
            array(
                'label' => 'Jobs Created',
                'key' => 'emp_creation_tl',
                'width' => '20%',
            ),
            array(
                'label' => 'Establishments',
                'key' => 'est_tl',
                'width' => '20%',
                'second' => array(
                  'label' => 'Growth Rate',
                  'value' => 'Not Impl.'
                )
            )
          ),
          'delta' => 'hbs-viz-datatable2'
        )
      )
    ),
    'setting'
  );
  return $block['content'];
}


function _hbs_dashboard_cluster_chart($cluster) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_bar');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-bar"><div class="bar-wrapper"></div></div>';
  drupal_add_js(
    array(
      'hbs_bar' => array(
        'dataJson' => '/data/region/state/all/2013/' . $cluster,
        'typeFor' => 'cluster'
      )
    ),
    'setting'
  );
  return $block['content'];
}

function _hbs_dashboard_related($tags = NULL) {
  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'sticky', 'created'))
    ->condition('type', array('resource', 'blog'))
    ->condition('status', 1);

  //TODO add in some sort of conditions here and probably convert this to an efq

  $nids = $query->orderBy('sticky', 'DESC')
    ->orderBy('sticky', 'DESC')
    ->orderBy('created', 'DESC')
    ->range(0, 5)
    ->addTag('node_access')
    ->execute()
    ->fetchCol();

  if (!empty($nids)) {
    $nodes = node_load_multiple($nids);
    //$render_nodes = node_view_multiple($nodes);
    /*foreach ($render_nodes['nodes'] as $key => $node) {
      if (is_array($node)) {
        unset($render_nodes['nodes'][$key]['links']);
      }
    }*/
    $render_nodes= array(
      '#theme' => 'item_list',
      '#items' => array_filter(reset(node_view_multiple($nodes)),
        function(&$node) {
          if (!is_array($node))return false;
          unset($node['links']);
          $node = drupal_render($node);
          return true;
        })
      );

    return $render_nodes;
  }

  return array();
}

function _hbs_dashboard_region_scorecard_scatterplot($region_type, $region_id) {
  $block = module_invoke('hbs_viz', 'block_view', 'hbs_viz_scatterplot');
  $block['content']['#markup'] = '<div class="block-hbs-viz" id="block-hbs-viz-hbs-viz-scatterplot"><div class="chart-menu"></div><div class="scatterplot-wrapper"></div></div>';
  $years = _hbs_load_helper('/data/meta/years');
  drupal_add_js(
    array(
      'hbs_scatterplot' => array(
        'regionId' => $region_id,
        'dataJson' => '/data/region/' . $region_type . '/all/' . max($years) . '',
        'typeFor' => 'region'
      )
    ),
    'setting'
  );
  return $block['content'];
}


/**
* @ingroup subpages
* @{
*/

/**
 * Callback function to return the Performance page.
 */
function _hbs_dashboard_region_performance_callback($region_type, $region_data = NULL) {
  $data = $region_data? array('region' => $region_data) : array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    //drupal_add_js(drupal_get_path('module', 'hbs_viz') .'/js/hbs-clustergrid.js', 'file');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_cluster.js', 'file');
    drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');
    _hbs_dashboard_region_compare($data['region']['region_type_t'], $data['region']['region_code_t']);
    $build['region_code'] = $data['region']['region_code_t'];
    $build['region_type'] = $data['region']['region_type_t'];
    _hbs_dashboard_add_common_js('region', $data);
    return theme('hbs_region_subpage_performance', $build);
  }
}

/**
 * Callback function to return the Cluster Portfolio page.
 */
function _hbs_dashboard_region_cluster_portfolio_callback($region_type, $region_data = NULL) {
  $data = $region_data? array('region' => $region_data) : array();
  $build = array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {

    if($data['region']['strong_clusters']){
      $selected = array();
      foreach ($data['region']['strong_clusters'] as $key => $value) {
        array_push($selected, $value['code']);
      }
      drupal_add_js( array( 'hbs_cluster_grid' => array('selected' => $selected ) ), 'setting');
    }

    $build['relatedclusters_chart'] = '<iframe src="/data/report/relatedclusters#/'
      . $region_data['region_type_t'] .'/'. $region_data['region_key_t'] .'" scrolling="no"></iframe>';


    _hbs_dashboard_region_compare($data);
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_dashboard.js', 'file');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_cluster.js', 'file');
    drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');
    drupal_add_js(drupal_get_path('module', 'hbs_viz') .'/js/hbs-clustergrid.js', 'file');
    $year = _hbs_indicator_year('emp_tl', 'all', $region_data['region_type_t']);
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    $innovation_year = _hbs_indicator_year('patent_count_tf', 'all', $region_data['region_type_t']);
    drupal_add_js(array('hbs_dashboard' => array('innovation_year' => $innovation_year)), 'setting');
    _hbs_dashboard_add_common_js('region', $data);
    return theme('hbs_region_subpage_cluster_composition', $build);
  }
}

/**
 * Callback function to return the Sub-Regions page.
 */
function _hbs_dashboard_region_subregions_callback($region_type, $region_data = NULL) {
  //$item = menu_get_item();
  $data = $region_data ? array( 'region' => $region_data) : array();
  $build = array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $build = array();
    if ($region_type == 'state') {
        $subtype = 'economic';
    } else {
        $subtype = 'county';
    }
    $year = _hbs_indicator_year('emp_tl', 'all', $region_type);
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    $innovation_year = _hbs_indicator_year('patent_count_tf', 'all', $region_type);
    drupal_add_js(array('hbs_dashboard' => array('innovation_year' => $innovation_year)), 'setting');

    _hbs_dashboard_region_compare($data['region']['region_type_t'], $data['region']['region_code_t']);
    $build['map'] = _hbs_dashboard_main_map();
    $build['subregions_wages'] = '<iframe src="/data/report/region/subregions#/' . $region_type . '/' . $data['region']['key_t'] . '/1998/' . $year. '/' . $subtype . '/private_wage_tf" scrolling="no"></iframe>';
    $build['subregions_employment'] = '<iframe src="/data/report/region/subregions#/' .  $region_type . '/' . $data['region']['key_t'] . '/1998/' . $year. '/' . $subtype . '/emp_tl" scrolling="no"></iframe>';
      _hbs_dashboard_add_common_js('region', $data);
    return theme('hbs_region_subpage_subregions', $build);
  }
}

/**
 * Callback function to return the Organizations & Resources page.
 */
function _hbs_dashboard_region_organizations_callback($region_type, $region_id) {
  $item = menu_get_item();
  return theme('hbs_region_subpage_organizations', array('region_object' => $item['map'][2]));
}

function _hbs_dashboard_cluster_top_regions_callback($cluster_data = NULL) {

  $data = $cluster_data ? array('cluster' => $cluster_data): array();
  $build = array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $cluster_key = $data['cluster']['key_t'];
    $build = array();
    $build['map'] = _hbs_dashboard_main_map();
    $build['cluster_name'] = $data['cluster']['name_t'];
    $year = _hbs_indicator_year('emp_tl', $cluster_key, 'country');
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    $innovation_year = _hbs_indicator_year('patent_count_tf', $cluster_key, 'country');
    drupal_add_js(array('hbs_dashboard' => array('innovation_year' => $innovation_year)), 'setting');

    $hash = quick_search_callback_set('hbs_cluster_autocomplete_qs_callback');
    drupal_add_js(array( 'quick_search' => array(
        'region-cluster-input-regions' => array(
          'path' => base_path() . "quick_search/$hash/cluster/$cluster_key",
          'minlength' => 1,
        ),
    )), 'setting');
    drupal_add_js(array(
        'hbs_dashboard' => array(
          'year' => $year,
        ),
      ), 'setting');
    _hbs_dashboard_add_common_js('cluster', $data, 'topRegions');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_cluster_topregion.js', 'file');
    drupal_add_css(drupal_get_path('module', 'hbs_viz') . '/css/hbs-viz.css', 'file');
    return theme('hbs_cluster_subpage_top_regions', $build);
  }
}

function _hbs_dashboard_cluster_subclusters_callback($cluster_data = NULL) {
  $data = $cluster_data ? array('cluster' => $cluster_data): array();
  $build = array();
  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $build = array();
    $build['map'] = _hbs_dashboard_main_map();
    $year = _hbs_indicator_year('emp_tl', $cluster_key, 'country');
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    _hbs_dashboard_add_common_js('cluster', $data, 'subClusters');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_cluster.js', 'file');
    return theme('hbs_cluster_subpage_subclusters', $build);
  }
}

function _hbs_dashboard_cluster_subcluster_summary_callback($cluster_data = NULL, $subcluster_data = NULL){

  $data = !empty($subcluster_data)? array('cluster' => $cluster_data, 'subcluster' => $subcluster_data): array();
  $build = array();

  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $build = array();
    $build['map'] = _hbs_dashboard_main_map();
    _hbs_dashboard_add_common_js('subCluster', $data);
    $cluster_key = $data['cluster']['key_t'] .'/'. $data['subcluster']['key_t'];
    $year = _hbs_indicator_year('emp_tl', $cluster_key, 'country');
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_cluster_topregion.js', 'file');
    return theme('hbs_cluster_subpage_subcluster_summary', $build);
  }
}

function _hbs_dashboard_cluster_organizations_callback($region_id) {
  $item = menu_get_item();
  return theme('hbs_cluster_subpage_organizations', array('cluster_object' => $item['map'][ 1]));
}





/**
 * Callback function for region-cluster dashboard.
 */

function _hbs_dashboard_region_cluster_page_callback($cluster_data = NULL, $region_data = NULL) {
    $data = $cluster_data ?  array( 'cluster' => $cluster_data, 'region' => $region_data ) : array();
    $build = array();
    if (empty($data)) {
        return MENU_NOT_FOUND;
    } else {
        $cluster_code = $data['cluster']['cluster_code_t'];
        _hbs_dashboard_add_common_js('region-cluster', $data, 'summary');

        $build['map'] = _hbs_dashboard_main_map();
        $build['related'] = _hbs_dashboard_related();
        $years = _hbs_load_helper('/data/meta/years');

        $build['relatedclusters_chart'] = '<iframe src="/data/report/relatedclusters#/'
          . $cluster_code . '/'
          . $region_data['region_type_t'] .'/'
          . $region_data['region_key_t'] .'" scrolling="no"></iframe>';

        $build['subcluster_chart'] = '<iframe src="/data/report/region/jobcreation#/' . $data['region']['region_type_t'] . '/' . $data['region']['key_t'] . '/1998/2017/' . $cluster_code . '?benchmark=false" scrolling="no"></iframe>';
        drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_cluster.js', 'file');

        $build['related_organizations'] = _hbs_dashboard_related_content('organization');
        $build['related_blogs'] = _hbs_dashboard_related_content('blog');
        $build['related_resources'] = _hbs_dashboard_related_content('resource');
      
      if (isset($data['cluster']['related_clusters'])) {
        $build['relatedclusters_chart'] = '<iframe src="/data/report/relatedclusters#/'. $cluster_code 
            .'/'. $region_data['region_type_t'] .'/'. $region_data['region_key_t'] .'" scrolling="no"></iframe>';
      }
    }
    return theme('hbs_region_cluster_dashboard_template', $build);
}

function _hbs_dashboard_region_cluster_subregions_callback($cluster_data = NULL, $region_data = NULL, $region_type) {
  $data = $cluster_data ?  array( 'cluster' => $cluster_data, 'region' => $region_data ) : array();
  $build = array();

  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $region_type = $region_data['region_type_t'];
    if ($region_type == 'state') {
        $subtype = 'economic';
    } else {
        $subtype = 'county';
    }
    _hbs_dashboard_add_common_js('region-cluster', $data, 'summary');
    $years = _hbs_load_helper('/data/meta/years');

    $build['map'] = _hbs_dashboard_main_map();
    $build['subregions_wages'] = '<iframe src="/data/report/region/subregions#/' . $region_type . '/' . $data['region']['key_t'] . '/1998/'. max($years) .'/' . $subtype . '/private_wage_tf" scrolling="no"></iframe>';
    $build['subregions_employment'] = '<iframe src="/data/report/region/subregions#/' .  $region_type . '/' . $data['region']['key_t'] . '/1998/'. max($years) .'/' . $subtype . '/emp_tl" scrolling="no"></iframe>';

    return theme('hbs_region_cluster_subpage_subregions', $build);
  }
}

function _hbs_dashboard_region_cluster_subclusters_callback($cluster_data = NULL, $region_data = NULL) {
  $data = $cluster_data ? array('cluster' => $cluster_data, 'region' => $region_data ): array();
  $build = array();

  if (empty($data)) {
    return MENU_NOT_FOUND;
  } else {
    $build = array();
    $build['map'] = _hbs_dashboard_main_map();
    $year = _hbs_indicator_year('emp_tl', $data['cluster']['key_t'], $data['region']['region_type_t']);
    drupal_add_js(array('hbs_dashboard' => array('year' => $year)), 'setting');
    $innovation_year = _hbs_indicator_year('patent_count_tf', $data['cluster']['key_t'], $data['region']['region_type_t']);
    drupal_add_js(array('hbs_dashboard' => array('innovation_year' => $innovation_year)), 'setting');
    _hbs_dashboard_add_common_js('region-cluster', $data, 'subClusters');
    drupal_add_js(drupal_get_path('module', 'hbs_dashboard') .'/js/hbs_region_cluster.js', 'file');

    return theme('hbs_region_cluster_subpage_subclusters', $build);
  }
}

/**
 * This function returns a generic render array suitable for displaying in a template
 * using the render() function.
 */
function _hbs_dashboard_placeholder($x, $y) {
  return array(
    '#markup' => '<img src="http://placehold.it/' . $x . 'x' . $y . '?t=' . time() . '">',
  );
}


function _hbs_dashboard_region_related_callback($region, $type) {
  return array('#markup' => 'Placeholder page');
}

/**
 * @} End of "ingroup subpages".
 */
