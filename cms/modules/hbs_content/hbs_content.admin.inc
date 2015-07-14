<?php

/**
 * Form function to display the serialized array of the given node in a textarea box.
 */
function hbs_content_export_node($form, &$form_state, $node) {
  $machine_name = _hbs_content_machine_name($node->title);
  $export = array($machine_name => $node);
  return _hbs_content_export_item($form, $export, "nodes/$machine_name.inc");

}

/**
 * Form function to display the serialized array of the given taxonomy term in a textarea box.
 */
function hbs_content_export_term($form, &$form_state, $term) {
  $machine_name = _hbs_content_machine_name($term->name);
  $export = array($machine_name => $term);
  return _hbs_content_export_item($form, $export, "terms/$machine_name.inc");
}

/**
 * Helper function to use the same textarea form element to display an exportable object.
 */
function _hbs_content_export_item($form, $export, $filename) {
  $export = "<?php\n\n\$content = " . var_export(json_encode($export), TRUE) . ';';

  $form['filename'] = array(
    '#type' => 'markup',
    '#title' => "Filename",
    '#markup' => '<b>Filename: </b>' . $filename,
  );

  $form['item'] = array(
    '#type' => 'textarea',
    '#title' => t('Term content'),
    '#default_value' => $export,
    '#rows' => 20,
  );

  return $form;
}
