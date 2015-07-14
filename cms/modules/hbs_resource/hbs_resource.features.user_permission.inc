<?php
/**
 * @file
 * hbs_resource.features.user_permission.inc
 */

/**
 * Implements hook_user_default_permissions().
 */
function hbs_resource_user_default_permissions() {
  $permissions = array();

  // Exported permission: 'create resource content'.
  $permissions['create resource content'] = array(
    'name' => 'create resource content',
    'roles' => array(
      'administrator' => 'administrator',
      'authenticated user' => 'authenticated user',
    ),
    'module' => 'node',
  );

  return $permissions;
}
