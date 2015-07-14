<?php
/**
 * @file
 * hbs_organizations.features.user_permission.inc
 */

/**
 * Implements hook_user_default_permissions().
 */
function hbs_organizations_user_default_permissions() {
  $permissions = array();

  // Exported permission: 'create member content'.
  $permissions['create member content'] = array(
    'name' => 'create member content',
    'roles' => array(
      'administrator' => 'administrator',
      'authenticated user' => 'authenticated user',
    ),
    'module' => 'node',
  );

  // Exported permission: 'create organization content'.
  $permissions['create organization content'] = array(
    'name' => 'create organization content',
    'roles' => array(
      'administrator' => 'administrator',
      'authenticated user' => 'authenticated user',
    ),
    'module' => 'node',
  );

  // Exported permission: 'edit own member content'.
  $permissions['edit own member content'] = array(
    'name' => 'edit own member content',
    'roles' => array(
      'administrator' => 'administrator',
      'authenticated user' => 'authenticated user',
    ),
    'module' => 'node',
  );

  // Exported permission: 'edit own organization content'.
  $permissions['edit own organization content'] = array(
    'name' => 'edit own organization content',
    'roles' => array(
      'administrator' => 'administrator',
      'authenticated user' => 'authenticated user',
    ),
    'module' => 'node',
  );

  return $permissions;
}
