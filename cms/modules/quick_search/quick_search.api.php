<?php
/**
 * @FILE
 * Here we will show which function one needs to implement to display a quick search list on a text field
 */

/**
 * first one has to create a callback function that takes a search string as a param
 * PARAM $search: A string on which we are searching
 * RETURN an array of items to display (most likely links)
 */
function quick_search_example_qs_callback($search) {
  $view = views_get_view('quick_search_example_view');
  $view->set_arguments(array($search));
  $view->pre_execute();
  $view->execute();
  foreach($view->result as $result) {
    $item = $result->_entity_properties;
    $rtn[] = l($item['title'], $item['url']);
  }
  return $rtn;
}


/**
 *  Implementation of hook_form_alter().
 *  
 *  One then needs to implement a form alter some where and do to things. 
 *  add a pre_render for quick_search_process_search
 *  as well as add the callback to be used.
 *  both of this should be add to the texfield that will be quick search enabled
 */
function quick_search_form_views_exposed_form_alter(&$form, &$form_state, $form_id) {
    $form['search_api_views_fulltext']['#pre_render'][] = 'quick_search_process_search';
    $form['search_api_views_fulltext']['#attributes']['quick_search_callback'] = 'quick_search_example_qs_callback';
}
