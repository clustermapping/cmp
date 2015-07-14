<?php
/**
 * @file
 * dashboard_features.views_default.inc
 */

/**
 * Implements hook_views_default_views().
 */
function dashboard_features_views_default_views() {
  $export = array();

  $view = new view();
  $view->name = 'related';
  $view->description = '';
  $view->tag = 'default';
  $view->base_table = 'node';
  $view->human_name = 'Related';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['use_more'] = TRUE;
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['use_more_text'] = 'More related content';
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '10';
  $handler->display->display_options['style_plugin'] = 'default';
  $handler->display->display_options['row_plugin'] = 'node';
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['area']['id'] = 'area';
  $handler->display->display_options['empty']['area']['table'] = 'views';
  $handler->display->display_options['empty']['area']['field'] = 'area';
  $handler->display->display_options['empty']['area']['empty'] = TRUE;
  $handler->display->display_options['empty']['area']['content'] = '<p>There is no related content.</p>';
  $handler->display->display_options['empty']['area']['format'] = 'full_html';
  $handler->display->display_options['empty']['area']['tokenize'] = TRUE;
  /* Field: Content: Title */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  /* Sort criterion: Content: Post date */
  $handler->display->display_options['sorts']['created']['id'] = 'created';
  $handler->display->display_options['sorts']['created']['table'] = 'node';
  $handler->display->display_options['sorts']['created']['field'] = 'created';
  $handler->display->display_options['sorts']['created']['order'] = 'DESC';
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Regions (field_regions:solr_key) */
  $handler->display->display_options['arguments']['field_regions_solr_key']['id'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['table'] = 'field_data_field_regions';
  $handler->display->display_options['arguments']['field_regions_solr_key']['field'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_options']['argument'] = 'arkansas';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_regions_solr_key']['specify_validation'] = TRUE;
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['type'] = 'php';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate_options']['code'] = 'if ($argument == \'region\') {
  $handler->argument = $handler->view->args[3];
}
return true;';
    $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['fail'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';
  /* Filter criterion: Content: Published */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = '1';
  $handler->display->display_options['filters']['status']['group'] = 1;
  $handler->display->display_options['filters']['status']['expose']['operator_id'] = '';
  $handler->display->display_options['filters']['status']['expose']['label'] = 'Published';
  $handler->display->display_options['filters']['status']['expose']['operator'] = 'status_op';
  $handler->display->display_options['filters']['status']['expose']['identifier'] = 'status';
  $handler->display->display_options['filters']['status']['expose']['required'] = TRUE;
  $handler->display->display_options['filters']['status']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    3 => 0,
    1000 => 0,
  );

  /* Display: Regions Related Page */
  $handler = $view->new_display('page', 'Regions Related Page', 'page');
  $handler->display->display_options['defaults']['use_more'] = FALSE;
  $handler->display->display_options['use_more'] = TRUE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['use_more_always'] = TRUE;
  $handler->display->display_options['defaults']['use_more_text'] = FALSE;
  $handler->display->display_options['use_more_text'] = 'More related content';
  $handler->display->display_options['exposed_block'] = TRUE;
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Regions (field_regions:solr_key) */
  $handler->display->display_options['arguments']['field_regions_solr_key']['id'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['table'] = 'field_data_field_regions';
  $handler->display->display_options['arguments']['field_regions_solr_key']['field'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_options']['argument'] = 'arkansas';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_regions_solr_key']['specify_validation'] = TRUE;
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['type'] = 'php';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate_options']['code'] = '$args = $handler->view->args;
array_shift($args);
$handler->argument = \'region/\' . join(\'/\', $args);
return true;';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['fail'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';
  $handler->display->display_options['path'] = 'related/%/region/%';

  /* Display: Regions Related Block */
  $handler = $view->new_display('block', 'Regions Related Block', 'block');
  $handler->display->display_options['defaults']['title'] = FALSE;
  $handler->display->display_options['title'] = 'Related';
  $handler->display->display_options['defaults']['use_more'] = FALSE;
  $handler->display->display_options['use_more'] = TRUE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['use_more_always'] = TRUE;
  $handler->display->display_options['defaults']['use_more_text'] = FALSE;
  $handler->display->display_options['use_more_text'] = 'More related content';
  $handler->display->display_options['defaults']['pager'] = FALSE;
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['pager']['options']['items_per_page'] = '5';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['defaults']['style_plugin'] = FALSE;
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['style_options']['default_row_class'] = FALSE;
  $handler->display->display_options['style_options']['row_class_special'] = FALSE;
  $handler->display->display_options['style_options']['wrapper_class'] = 'item-list community-nodes';
  $handler->display->display_options['defaults']['style_options'] = FALSE;
  $handler->display->display_options['defaults']['row_plugin'] = FALSE;
  $handler->display->display_options['row_plugin'] = 'fields';
  $handler->display->display_options['defaults']['row_options'] = FALSE;
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Regions (field_regions:solr_key) */
  $handler->display->display_options['arguments']['field_regions_solr_key']['id'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['table'] = 'field_data_field_regions';
  $handler->display->display_options['arguments']['field_regions_solr_key']['field'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_options']['argument'] = 'arkansas';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['fail'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';

  /* Display: Clusters Related Block */
  $handler = $view->new_display('block', 'Clusters Related Block', 'block_1');
  $handler->display->display_options['defaults']['title'] = FALSE;
  $handler->display->display_options['title'] = 'Related';
  $handler->display->display_options['defaults']['use_more'] = FALSE;
  $handler->display->display_options['use_more'] = TRUE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['use_more_always'] = TRUE;
  $handler->display->display_options['defaults']['use_more_text'] = FALSE;
  $handler->display->display_options['use_more_text'] = 'More related content';
  $handler->display->display_options['defaults']['pager'] = FALSE;
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['pager']['options']['items_per_page'] = '5';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['defaults']['style_plugin'] = FALSE;
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['style_options']['default_row_class'] = FALSE;
  $handler->display->display_options['style_options']['row_class_special'] = FALSE;
  $handler->display->display_options['style_options']['wrapper_class'] = 'item-list community-nodes';
  $handler->display->display_options['defaults']['style_options'] = FALSE;
  $handler->display->display_options['defaults']['row_plugin'] = FALSE;
  $handler->display->display_options['row_plugin'] = 'fields';
  $handler->display->display_options['defaults']['row_options'] = FALSE;
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Clusters (field_clusters:solr_key) */
  $handler->display->display_options['arguments']['field_clusters_solr_key']['id'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['table'] = 'field_data_field_clusters';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['field'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['limit'] = '0';

  /* Display: Clusters Related Page */
  $handler = $view->new_display('page', 'Clusters Related Page', 'page_1');
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Clusters (field_clusters:solr_key) */
  $handler->display->display_options['arguments']['field_clusters_solr_key']['id'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['table'] = 'field_data_field_clusters';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['field'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['specify_validation'] = TRUE;
  $handler->display->display_options['arguments']['field_clusters_solr_key']['validate']['type'] = 'php';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['validate_options']['code'] = '$handler->argument = \'cluster/\' . $handler->argument;
return true;';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['limit'] = '0';
  $handler->display->display_options['path'] = 'related/%/cluster';

  /* Display: Region-Clusters Related Page */
  $handler = $view->new_display('page', 'Region-Clusters Related Page', 'page_2');
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Clusters (field_clusters:solr_key) */
  $handler->display->display_options['arguments']['field_clusters_solr_key']['id'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['table'] = 'field_data_field_clusters';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['field'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['specify_validation'] = TRUE;
  $handler->display->display_options['arguments']['field_clusters_solr_key']['validate']['type'] = 'php';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['validate_options']['code'] = '$handler->argument = \'cluster/\' . $view->args[1];
return true;';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['limit'] = '0';
  /* Contextual filter: Content: Regions (field_regions:solr_key) */
  $handler->display->display_options['arguments']['field_regions_solr_key']['id'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['table'] = 'field_data_field_regions';
  $handler->display->display_options['arguments']['field_regions_solr_key']['field'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_regions_solr_key']['specify_validation'] = TRUE;
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate']['type'] = 'php';
  $handler->display->display_options['arguments']['field_regions_solr_key']['validate_options']['code'] = '$handler->argument = \'region/\' . $view->args[2] . \'/\' . $view->args[3];
return true;';
  $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';
  $handler->display->display_options['path'] = 'related/%/region-cluster/%';

  /* Display: Region-Clusters Related Block */
  $handler = $view->new_display('block', 'Region-Clusters Related Block', 'block_2');
  $handler->display->display_options['defaults']['title'] = FALSE;
  $handler->display->display_options['title'] = 'Related';
  $handler->display->display_options['defaults']['use_more'] = FALSE;
  $handler->display->display_options['use_more'] = TRUE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['defaults']['use_more_always'] = FALSE;
  $handler->display->display_options['use_more_always'] = TRUE;
  $handler->display->display_options['defaults']['use_more_text'] = FALSE;
  $handler->display->display_options['use_more_text'] = 'More related content';
  $handler->display->display_options['defaults']['pager'] = FALSE;
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['pager']['options']['items_per_page'] = '5';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['defaults']['style_plugin'] = FALSE;
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['style_options']['default_row_class'] = FALSE;
  $handler->display->display_options['style_options']['row_class_special'] = FALSE;
  $handler->display->display_options['style_options']['wrapper_class'] = 'item-list community-nodes';
  $handler->display->display_options['defaults']['style_options'] = FALSE;
  $handler->display->display_options['defaults']['row_plugin'] = FALSE;
  $handler->display->display_options['row_plugin'] = 'fields';
  $handler->display->display_options['defaults']['row_options'] = FALSE;
  $handler->display->display_options['defaults']['arguments'] = FALSE;
  /* Contextual filter: Content: Type */
  $handler->display->display_options['arguments']['type']['id'] = 'type';
  $handler->display->display_options['arguments']['type']['table'] = 'node';
  $handler->display->display_options['arguments']['type']['field'] = 'type';
  $handler->display->display_options['arguments']['type']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['type']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['type']['default_argument_options']['argument'] = 'blog';
  $handler->display->display_options['arguments']['type']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['type']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['type']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['type']['limit'] = '0';
  /* Contextual filter: Content: Clusters (field_clusters:solr_key) */
  $handler->display->display_options['arguments']['field_clusters_solr_key']['id'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['table'] = 'field_data_field_clusters';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['field'] = 'field_clusters_solr_key';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_clusters_solr_key']['limit'] = '0';
  /* Contextual filter: Content: Regions (field_regions:solr_key) */
  $handler->display->display_options['arguments']['field_regions_solr_key']['id'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['table'] = 'field_data_field_regions';
  $handler->display->display_options['arguments']['field_regions_solr_key']['field'] = 'field_regions_solr_key';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_action'] = 'empty';
  $handler->display->display_options['arguments']['field_regions_solr_key']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_regions_solr_key']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_regions_solr_key']['limit'] = '0';

  $export['related'] = $view;

  return $export;
}
