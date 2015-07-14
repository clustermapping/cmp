<?php

/**
 *  @file
 *  Provide admin functionality for quick search
 */
function quick_search_admin ($form, &$form_state) {
  // this is for testing only
  $form['quick_search_minlength'] = array(
    '#type' => 'textfield',
    '#title' => t('Quick Search Min Length'),
    '#description' => t('How many letters must be typed before the search is triggered.'),
    '#default_value' => variable_get('quick_search_minlength', 3),
  );

  return system_settings_form($form);
}