<?php
/**
 * @file
 * hbs_organizations.views_default.inc
 */

/**
 * Implements hook_views_default_views().
 */
function hbs_organizations_views_default_views() {
  $export = array();

  $view = new view();
  $view->name = 'member_reference';
  $view->description = 'Options for User Member Autocomplete Reference';
  $view->tag = 'default';
  $view->base_table = 'node';
  $view->human_name = 'Member Reference';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Member Reference';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '10';
  $handler->display->display_options['style_plugin'] = 'default';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Relationship: Content: Member Reference (field_member_reference) - reverse */
  $handler->display->display_options['relationships']['reverse_field_member_reference_user']['id'] = 'reverse_field_member_reference_user';
  $handler->display->display_options['relationships']['reverse_field_member_reference_user']['table'] = 'node';
  $handler->display->display_options['relationships']['reverse_field_member_reference_user']['field'] = 'reverse_field_member_reference_user';
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
  /* Filter criterion: Content: Published */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = 1;
  $handler->display->display_options['filters']['status']['group'] = 1;
  $handler->display->display_options['filters']['status']['expose']['operator'] = FALSE;
  /* Filter criterion: Content: Type */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'node';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    'member' => 'member',
  );
  /* Filter criterion: User: Member Reference (field_member_reference) */
  $handler->display->display_options['filters']['field_member_reference_nid']['id'] = 'field_member_reference_nid';
  $handler->display->display_options['filters']['field_member_reference_nid']['table'] = 'field_data_field_member_reference';
  $handler->display->display_options['filters']['field_member_reference_nid']['field'] = 'field_member_reference_nid';
  $handler->display->display_options['filters']['field_member_reference_nid']['relationship'] = 'reverse_field_member_reference_user';
  $handler->display->display_options['filters']['field_member_reference_nid']['operator'] = 'empty';

  /* Display: References */
  $handler = $view->new_display('references', 'References', 'references_1');
  $handler->display->display_options['defaults']['title'] = FALSE;
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['defaults']['style_plugin'] = FALSE;
  $handler->display->display_options['style_plugin'] = 'references_style';
  $handler->display->display_options['defaults']['style_options'] = FALSE;
  $handler->display->display_options['defaults']['row_plugin'] = FALSE;
  $handler->display->display_options['row_plugin'] = 'references_fields';
  $handler->display->display_options['defaults']['row_options'] = FALSE;
  $export['member_reference'] = $view;

  return $export;
}
