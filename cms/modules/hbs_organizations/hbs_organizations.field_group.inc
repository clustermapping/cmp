<?php
/**
 * @file
 * hbs_organizations.field_group.inc
 */

/**
 * Implements hook_field_group_info().
 */
function hbs_organizations_field_group_info() {
  $export = array();

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_activities|node|organization|form';
  $field_group->group_name = 'group_activities';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'organization';
  $field_group->mode = 'form';
  $field_group->parent_name = '';
  $field_group->data = array(
    'label' => 'What are your organization\'s main activities?',
    'weight' => '12',
    'children' => array(
      0 => 'field_primary_activity',
      1 => 'field_secondary_activities',
      2 => 'field_company_focus',
    ),
    'format_type' => 'fieldset',
    'format_settings' => array(
      'formatter' => 'collapsible',
      'instance_settings' => array(
        'description' => '',
        'classes' => 'group-activities field-group-fieldset',
        'required_fields' => 1,
      ),
    ),
  );
  $export['group_activities|node|organization|form'] = $field_group;

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_contact|node|organization|form';
  $field_group->group_name = 'group_contact';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'organization';
  $field_group->mode = 'form';
  $field_group->parent_name = '';
  $field_group->data = array(
    'label' => 'Organization Contact',
    'weight' => '15',
    'children' => array(
      0 => 'field_email',
      1 => 'field_first_name',
      2 => 'field_last_name',
    ),
    'format_type' => 'fieldset',
    'format_settings' => array(
      'label' => 'Organization Contact',
      'instance_settings' => array(
        'required_fields' => 1,
        'classes' => 'group-contact field-group-fieldset',
        'description' => 'Provide contact information for an individual within this Organization.',
      ),
      'formatter' => 'open',
    ),
  );
  $export['group_contact|node|organization|form'] = $field_group;

  return $export;
}
