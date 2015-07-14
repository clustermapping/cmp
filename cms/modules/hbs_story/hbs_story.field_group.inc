<?php
/**
 * @file
 * hbs_story.field_group.inc
 */

/**
 * Implements hook_field_group_info().
 */
function hbs_story_field_group_info() {
  $export = array();

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_map_data|node|story|form';
  $field_group->group_name = 'group_map_data';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'story';
  $field_group->mode = 'form';
  $field_group->parent_name = '';
  $field_group->data = array(
    'label' => 'Map Data',
    'weight' => '2',
    'children' => array(
      0 => 'field_story_cluster',
      1 => 'field_story_highlighted_areas',
      2 => 'field_story_region_type',
      3 => 'field_story_year',
      4 => 'field_story_map_key',
    ),
    'format_type' => 'fieldset',
    'format_settings' => array(
      'formatter' => 'collapsible',
      'instance_settings' => array(
        'description' => '',
        'classes' => 'group-map-data field-group-fieldset',
        'required_fields' => 1,
      ),
    ),
  );
  $export['group_map_data|node|story|form'] = $field_group;

  return $export;
}
