<?php

/**
 * @file template.php
 */

function clustermapping_preprocess_html(&$variables) {
  $fonts = array(
    '#tag' => 'link',
    '#attributes' => array(
      'href' => 'http://fonts.googleapis.com/css?family=Source+Sans+Pro:400,400italic,700,900,700italic,900italic,600italic,600|Lato:400,700,900,700italic,900italic,400italic',
      'rel' => 'stylesheet',
      'type' => 'text/css',
    ),
  );
  drupal_add_html_head($fonts, 'google_fonts');

  $item = menu_get_item();
  if ($item['path'] = 'related' || $item['path'] = 'cluster/related') {
    $variables['head_title'] = implode(' | ', $variables['head_title_array']);
  }

  drupal_add_js(variable_get('hbs_secondary_analytics', 'http://www.hbs.edu/apps/isc/js/analytics.js'), 'external');
}

function clustermapping_preprocess_views_view(&$variables) {
  $item = menu_get_item();
  $type_names = array(
    'resource' => 'Resources',
    'blog' => 'Blog Posts',
    'organization' => 'Organizations',
  );
  // dpm($item['path']);
  switch ($item['path']) {
    case 'related/%/region-cluster/%':
    case 'related/%/cluster':
    case 'related/%/region/%':
      $type = $item['map'][2];
      $args = array_slice($item['map'], 2);
      $breadcrumb = array(l('Home', '<front>'));
      switch ($type) {
        case 'cluster':
          $breadcrumb[] = l('Clusters', 'cluster');
          $breadcrumb[] = l(ucwords(str_replace('_', ' ', $args[1])), join('/', $args));
          break;
        case 'region':
          $breadcrumb[] = l('Regions', 'region');
          $breadcrumb[] = l(ucwords(str_replace('_', ' ', $args[2])), join('/', $args));
          break;
        case 'region-cluster':
          $breadcrumb[] = l('Region-Cluster', join('/', $args));
          $breadcrumb[] = l(ucwords(str_replace('_', ' ', $args[1])), 'cluster/' . $args[1]) . ' - ' 
              . l(ucwords(str_replace('_', ' ', $args[3])), 'region/' . $args[2] . '/' . $args[3]);
          break;
      }
      drupal_set_breadcrumb($breadcrumb);
      break;
    case 'taxonomy/term/%':
      if ($item['map'][2]->vocabulary_machine_name != 'organization_type') {
        break;
      }
    case 'organization-type':
      $breadcrumbs = array(
        l('Home', '<front>'),
        l('Organizations', 'organizations'),
      );
      $args = arg();

      if (!empty($args[1])) {
        if ($args[1] != 'all') {
          if ($item['path'] == 'taxonomy/term/%' && $item['map'][2]->vocabulary_machine_name == 'organization_type') {
            $type = $item['map'][2];
          }
          else {
            $name  = str_replace('-', ' ', $args[1]);
            $type = array_shift(taxonomy_get_term_by_name($name, 'organization_type'));
          }
          $breadcrumbs[] = l($type->name, 'organization-type/' . $args[1]);
        }
        else {
          $breadcrumbs[] = l('All Organization Types', 'organization-type/all');
        }
      }

      if ($args[0] != 'taxonomy' && !empty($args[2])) {
        if ($args[2] != 'all') {
          $cluster = hbs_cluster_load($args[2]);
          $subtitle[] = $cluster['name_t'];
          $breadcrumbs[] = l($cluster['name_t'], implode('/', $args));
          drupal_set_title($cluster['name_t']);
        }
        else {
          $breadcrumbs[] = l('All Clusters', implode('/', $args));
        }
      }

      array_pop($breadcrumbs);

      drupal_set_breadcrumb($breadcrumbs);
      break;
  }
}

function clustermapping_preprocess_page(&$variables) {
  if (arg(0) == 'taxonomy' && arg(1) == 'term') {
    unset($variables['page']['content']['system_main']['nodes']);
  }

  $variables['classes_array'][] = $variables['page']['sidebar_first'] || $variables['page']['sidebar_second']? 'has-sidebar' : 'no-sidebar';

  // Modify search block
  $search_block = module_invoke('search', 'block_view', 'search');
  $search_block['content']['search_block_form']['#attributes']['placeholder'] = 'Cluster, Region, City, zip, or keyword';
  $search_block['content']['search_block_form']['#prefix'] = '<label class="pull-left">Explore</label><br />';
  $search_block['content']['search_block_form']['#attributes']['class'][] = 'form-control';
  $variables['search_block'] = render($search_block);
}

function clustermapping_preprocess_node(&$variables) {
  // if readmore link is set
  if (isset($variables['content']['links']['node']['#links']['node-readmore'])) {
    $variables['content']['links']['node']['#links']['node-readmore']['title'] .= '  <span class="more-arrow">&nbsp;&rarr;</span>';
  }
}

function clustermapping_menu_tree__secondary($variables) {
  return '<ul class="menu dropdown-menu" role="menu">' . $variables['tree'] . '</ul>';
}

function clustermapping_menu_tree__menu_add_content($variables) {
  // For anonymous users, display the same 4 add content links as user login links.
  // Because the Drupal UI doesn't allow for URL parameters in the link path, we have to
  // create the unordered list manually. We want all 4 links to go to the user/login path
  // with the destination of the node/add/TYPE path.
  // Additionally, we have a placholder menu link called 'Login' which allows this hook
  // to even be called when the user is not logged in. Authenticated users do NOT have
  // access permissions to see that Login link, so it doesn't show up for logged in users.
  global $user;
  if (!$user->uid) {
  }

    $variables['tree'] = '
<li class="leaf"><a href="/user?destination=node/add/organization" title="">Add Organization Entry</a></li>
<li class="leaf"><a href="/user?destination=node/add/member" title="">Add Member Profile</a></li>';
    $variables['theme_hook_suggestion'] = 'menu_tree__menu_add_content';
    $variables['theme_hook_suggestions'] = array();

  return '<div class="more-content pull-right" id="add-organization"><a href="'. (user_access('create blog content') ?  "/": "/user?destination=" ) .'node/add/organization"><span class="glyphicon glyphicon-plus"></span> Add Organization</a></div>
<div class="more-content pull-right" id="add-blog"><a href="'. (user_access('create blog content') ?  "/": "/user?destination=" ) .'node/add/blog"><span class="glyphicon glyphicon-plus"></span> Add Blog Post</a></div>
<div class="more-content pull-right" id="add-resource"><a href="'. (user_access('create resource content') ?  "/": "/user?destination=" ) .'node/add/resource"><span class="glyphicon glyphicon-plus"></span> Add Resource</a></div>
<div class="more-content pull-right" id="region-compare-button">
  <a id="region-compare-dropdown"><span class="glyphicon glyphicon-plus"></span> Compare Region </a>
  <div class="menu dropdown-menu" role="" id="region-compare-menu">
    <button type="button" class="close pull-right"> <span aria-hidden="true">&times;</span> <span class="sr-only">Close</span>
    </button>
    <div id="compare-region-add">
      <label class="label-region-compare-search">Search Region</label>
      <input title="Search region by name" quick_search_callback="hbs_comparison_autocomplete_qs_callback" placeholder="Search region by name, zip or keyword" class="form-control use-quicksearch form-text" autocomplete="off" type="text" id="region-compare-input-regions" name="search_comparison" value="" size="15" maxlength="128">
    </div>
    <div id="region-compare-edit">
      <p><button class="btn btn-info" id="region-compare-save"> Save </button> <button class="btn btn-link" id="region-compare-cancel"> Cancel </button> </p>
      <div class="control-group">
        <label> Comparison Name </label>
        <input type="text" class="form-control" id="region-compare-name" placeholder="Enter a Comparison Name">
      </div>

      <label class="label-region-compare-regions list-collapse"> Regions </label>
      <div>
        <div id="region-compare-regions" class="region-compare-list"> </div>
      </div>

      <label class="list-expand"> Clusters </label>
      <div>
        <select id="region-compare-input-clusters" class="form-control"> <option> -- Select Cluster -- </option> </select>
        <div id="region-compare-clusters" class="region-compare-list"> </div>
      </div>
      <label class="list-expand"> Indicators </label>
      <div>
        <select id="region-compare-input-indicators" class="form-control"> <option> -- Select Indicator -- </option> </select>
        <div id="region-compare-indicators" class="region-compare-list"> </div>
      </div>
    </div>
  </div>
</div>
<script>(function($) {
    $(".more-content .close").on("click", function(e) { $(this).parent().hide(); });
    $("#region-compare-dropdown").on("click", function (e) {
        e.preventDefault();
        $("#region-compare-menu").show();
        $("#region-compare-input-regions").focus();
    });
})(jQuery);
</script>';
}

function clustermapping_taxonomy_term_view($term, $view_mode, $langcode) {
  $breadcrumb = array();
  $breadcrumb[] = l('Home', '<front>');

  if ($term->vocabulary_machine_name == 'section' && $view_mode == 'full') {
    $nids = taxonomy_select_nodes($term->tid);
    $nodes = node_load_multiple($nids);
    $term->content += node_view_multiple($nodes);

    // $breadcrumb[] = l('Learn', 'learn');
    drupal_set_breadcrumb($breadcrumb);
  }
}


function clustermapping_node_view($node, $view_mode, $langcode) {

  if($view_mode == 'full' && $node->type != 'blog' && node_is_page($node)){
    $breadcrumb = array();
    $breadcrumb[] = l('Home', '<front>');
    switch ($node->type) {
      case 'organization':
        $breadcrumb[] = l('Organizations', 'organizations');
        break;
      case 'page':
        if ($node->title == 'About') {
          // $breadcrumb[] = l('Learn', 'learn');
        }
        elseif (!empty($node->field_section[LANGUAGE_NONE][0]['tid'])) {
          $term = taxonomy_term_load($node->field_section[LANGUAGE_NONE][0]['tid']);
          $breadcrumb[] = l('About', 'about');
          // $breadcrumb[] = l($term->name, 'taxonomy/term/' . $term->tid);
        }
        break;
      default:
        $breadcrumb[] = l(ucfirst($node->type) . 's', $node->type);
        break;
    }

    drupal_set_breadcrumb($breadcrumb);

  }
}

function clustermapping_breadcrumb($variables) {
  $output = '';
  $breadcrumb = $variables['breadcrumb'];

  if (arg(0) == 'region') return '';

  if(!empty($breadcrumb)){
    end($breadcrumb);
    $title = substr($breadcrumb[key($breadcrumb)]['data'], 0, 47);
    $breadcrumb[key($breadcrumb)]['data'] = strlen($title) < 47 ? $title : $title . "...";
  }

  // Determine if we are to display the breadcrumb.
  $bootstrap_breadcrumb = theme_get_setting('bootstrap_breadcrumb');
  if (($bootstrap_breadcrumb == 1 || ($bootstrap_breadcrumb == 2 && arg(0) == 'admin')) && !empty($breadcrumb)) {
    $output = theme('item_list', array(
      'attributes' => array(
        'class' => array('breadcrumb'),
      ),
      'items' => $breadcrumb,
      'type' => 'ol',
    ));
  }
  return $output;
}

function clustermapping_pager($variables) {
  $output = "";
  $items = array();
  $tags = $variables['tags'];
  $element = $variables['element'];
  $parameters = $variables['parameters'];
  $quantity = $variables['quantity'];

  global $pager_page_array, $pager_total;

  // Calculate various markers within this pager piece:
  // Middle is used to "center" pages around the current page.
  $pager_middle = ceil($quantity / 2);
  // Current is the page we are currently paged to.
  $pager_current = $pager_page_array[$element] + 1;
  // First is the first page listed by this pager piece (re quantity).
  $pager_first = $pager_current - $pager_middle + 1;
  // Last is the last page listed by this pager piece (re quantity).
  $pager_last = $pager_current + $quantity - $pager_middle;
  // Max is the maximum page number.
  $pager_max = $pager_total[$element];

  // Prepare for generation loop.
  $i = $pager_first;
  if ($pager_last > $pager_max) {
    // Adjust "center" if at end of query.
    $i = $i + ($pager_max - $pager_last);
    $pager_last = $pager_max;
  }
  if ($i <= 0) {
    // Adjust "center" if at start of query.
    $pager_last = $pager_last + (1 - $i);
    $i = 1;
  }

  // End of generation loop preparation.
  $li_previous = theme('pager_previous', array(
    'text' => (isset($tags[1]) ? $tags[1] : t('previous')),
    'element' => $element,
    'interval' => 1,
    'parameters' => $parameters,
  ));
  $li_next = theme('pager_next', array(
    'text' => (isset($tags[3]) ? $tags[3] : t('next')),
    'element' => $element,
    'interval' => 1,
    'parameters' => $parameters,
  ));

  if ($pager_total[$element] > 1) {

    if ($li_previous) {
      $items[] = array(
        'class' => array('prev'),
        'data' => $li_previous,
      );
    }
    // When there is more than one page, create the pager list.
    if ($i != $pager_max) {
      if ($i > 1) {
        $items[] = array(
          'class' => array('pager-ellipsis', 'disabled'),
          'data' => '<span>…</span>',
        );
      }
      // Now generate the actual pager piece.
      for (; $i <= $pager_last && $i <= $pager_max; $i++) {
        if ($i < $pager_current) {
          $items[] = array(
            // 'class' => array('pager-item'),
            'data' => theme('pager_previous', array(
              'text' => $i,
              'element' => $element,
              'interval' => ($pager_current - $i),
              'parameters' => $parameters,
            )),
          );
        }
        if ($i == $pager_current) {
          $items[] = array(
            // Add the active class.
            'class' => array('active'),
            'data' => l($i, '#', array('fragment' => '', 'external' => TRUE)),
          );
        }
        if ($i > $pager_current) {
          $items[] = array(
            'data' => theme('pager_next', array(
              'text' => $i,
              'element' => $element,
              'interval' => ($i - $pager_current),
              'parameters' => $parameters,
            )),
          );
        }
      }
      if ($i < $pager_max) {
        $items[] = array(
          'class' => array('pager-ellipsis', 'disabled'),
          'data' => '<span>…</span>',
        );
      }
    }
    // End generation.
    if ($li_next) {
      $items[] = array(
        'class' => array('next'),
        'data' => $li_next,
      );
    }

    return '<div class="">' . theme('item_list', array(
      'items' => $items,
      'attributes' => array('class' => array('pagination')),
    )) . '</div>';
  }
  return $output;
}
