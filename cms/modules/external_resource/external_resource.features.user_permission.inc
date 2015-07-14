<?php
/**
 * @file
 * external_resource.features.user_permission.inc
 */

/**
 * Implements hook_user_default_permissions().
 */
function external_resource_user_default_permissions() {
  $permissions = array();

  // Exported permission: 'create external_resource content'.
  $permissions['create external_resource content'] = array(
    'name' => 'create external_resource content',
    'roles' => array(
      'administrator' => 'administrator',
    ),
    'module' => 'node',
  );

  return $permissions;
}
