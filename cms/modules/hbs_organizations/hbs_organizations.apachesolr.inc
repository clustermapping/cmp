<?php
/**
 * @file
 * hbs_organizations.apachesolr.inc
 */

/**
 * Implements hook_apachesolr_index_document_build().
 */
function hbs_organizations_apachesolr_index_document_build($document, $entity, $entity_type) {

  if ($entity_type == 'node' && $entity->type == 'organization') {

    if (isset($entity->field_location)){
      $document->addField('location_lat_s', $entity->field_location['und'][0]['lat']);
      $document->addField('location_lng_s', $entity->field_location['und'][0]['lng']);
    }
    if (isset($entity->field_address)){
      $document->addField('address_postal_code_s', $entity->field_address['und'][0]['postal_code']);
      $document->addField('address_locality_s', $entity->field_address['und'][0]['locality']);
      $document->addField('address_administrative_area_s', $entity->field_address['und'][0]['administrative_area']);
    }

  }
}
