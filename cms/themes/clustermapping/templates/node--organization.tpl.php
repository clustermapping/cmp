<?php

/**
 * @file
 * Default theme implementation to display a node.
 *
 * Available variables:
 * - $title: the (sanitized) title of the node.
 * - $content: An array of node items. Use render($content) to print them all,
 *   or print a subset such as render($content['field_example']). Use
 *   hide($content['field_example']) to temporarily suppress the printing of a
 *   given element.
 * - $user_picture: The node author's picture from user-picture.tpl.php.
 * - $date: Formatted creation date. Preprocess functions can reformat it by
 *   calling format_date() with the desired parameters on the $created variable.
 * - $name: Themed username of node author output from theme_username().
 * - $node_url: Direct URL of the current node.
 * - $display_submitted: Whether submission information should be displayed.
 * - $submitted: Submission information created from $name and $date during
 *   template_preprocess_node().
 * - $classes: String of classes that can be used to style contextually through
 *   CSS. It can be manipulated through the variable $classes_array from
 *   preprocess functions. The default values can be one or more of the
 *   following:
 *   - node: The current template type; for example, "theming hook".
 *   - node-[type]: The current node type. For example, if the node is a
 *     "Blog entry" it would result in "node-blog". Note that the machine
 *     name will often be in a short form of the human readable label.
 *   - node-teaser: Nodes in teaser form.
 *   - node-preview: Nodes in preview mode.
 *   The following are controlled through the node publishing options.
 *   - node-promoted: Nodes promoted to the front page.
 *   - node-sticky: Nodes ordered above other non-sticky nodes in teaser
 *     listings.
 *   - node-unpublished: Unpublished nodes visible only to administrators.
 * - $title_prefix (array): An array containing additional output populated by
 *   modules, intended to be displayed in front of the main title tag that
 *   appears in the template.
 * - $title_suffix (array): An array containing additional output populated by
 *   modules, intended to be displayed after the main title tag that appears in
 *   the template.
 *
 * Other variables:
 * - $node: Full node object. Contains data that may not be safe.
 * - $type: Node type; for example, story, page, blog, etc.
 * - $comment_count: Number of comments attached to the node.
 * - $uid: User ID of the node author.
 * - $created: Time the node was published formatted in Unix timestamp.
 * - $classes_array: Array of html class attribute values. It is flattened
 *   into a string within the variable $classes.
 * - $zebra: Outputs either "even" or "odd". Useful for zebra striping in
 *   teaser listings.
 * - $id: Position of the node. Increments each time it's output.
 *
 * Node status variables:
 * - $view_mode: View mode; for example, "full", "teaser".
 * - $teaser: Flag for the teaser state (shortcut for $view_mode == 'teaser').
 * - $page: Flag for the full page state.
 * - $promote: Flag for front page promotion state.
 * - $sticky: Flags for sticky post setting.
 * - $status: Flag for published status.
 * - $comment: State of comment settings for the node.
 * - $readmore: Flags true if the teaser content of the node cannot hold the
 *   main body content.
 * - $is_front: Flags true when presented in the front page.
 * - $logged_in: Flags true when the current user is a logged-in member.
 * - $is_admin: Flags true when the current user is an administrator.
 *
 * Field variables: for each field instance attached to the node a corresponding
 * variable is defined; for example, $node->body becomes $body. When needing to
 * access a field's raw values, developers/themers are strongly encouraged to
 * use these variables. Otherwise they will have to explicitly specify the
 * desired field language; for example, $node->body['en'], thus overriding any
 * language negotiation rule that was previously applied.
 *
 * @see template_preprocess()
 * @see template_preprocess_node()
 * @see template_process()
 *
 * @ingroup themeable
 */
?>
<div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>

  <?php print render($title_prefix); ?>
  <?php if (!$page): ?>
    <h2<?php print $title_attributes; ?>><a href="<?php print $node_url; ?>"><?php print $title; ?></a></h2>
  <?php endif; ?>
  <?php print render($title_suffix); ?>

    <div class="content"<?php print $content_attributes; ?>>
      <div class="container">
        <div class="row">
          <div class="col-md-8">
            <?php
              // We hide the comments and links now so that we can render them later.
              hide($content['comments']);
              hide($content['links']);
              hide($content['field_website']);
              hide($content['field_members']);
              hide($content['field_address']);
              hide($content['field_telephone']);
              hide($content['field_location']);
              hide($content['field_logo']);
              hide($content['field_first_name']);
              hide($content['field_last_name']);
              hide($content['field_email']);
              hide($content['field_organization_type']);
              print render($content);
            ?>
            <?php if (!$teaser): ?>
              <div class="org-url">
                <?php print render($content['field_website']); ?>
              </div>

              <div class="org-url">
                <h3>Organization Type</h3>
                <?php print render($content['field_organization_type']); ?>
              </div>

              <?php  //print "<h3>Professional Associates</h3>"; ?>
              <?php //print $members; ?>
            <?php endif; ?>

          </div>
          <div class="col-md-4 org-right-rail">
            <div class="contact-info">
              <?php if (!$teaser): ?>
                <?php if ($content['field_logo'] ): ?>
                  <div class="organization-logo">
                    <?php print render($content['field_logo']); ?>
                  </div>
                <?php endif; ?>

                <h3>Contact Info</h3>
                <?php if (!empty($name) || !empty($email)): ?>
                  <p><?php print $name; ?></p>
                  <p><?php print $email; ?></p>
                  <p><?php print render($content['field_telephone']); ?></p>
                <?php else: ?>
                  <p class="no-data">No contact information available.</p>
                <?php endif; ?>
              <?php endif; ?>

              <h3>Location</h3>
              <?php if (!empty($address)): ?>
                <p><?php print $address['thoroughfare']; ?></p>
                <?php if (!empty($address['premise'])): ?><p><?php print $address['premise']; ?></p><?php endif; ?>
                <p>
                  <?php if ($address['locality']): ?>
                    <?php print $address['locality']; ?>,
                  <?php endif; ?>
                  <?php print $address['administrative_area']; ?> <?php print $address['postal_code']; ?>
                </p>
              <?php else: ?>
                <p class="no-data">No location information available.</p>
              <?php endif; ?>
            </div>

            <?php if (!$teaser): ?>
              <div class="org-directory">
                <h3>Organization Registry</h3>
                <p>Organizations added to directory can be found by others working in similar regions or clusters. Once an organization is registered, authorized users can update and add information about their organization.</p>
                <p>If you wish to change an Organization page, please <a href="/about/contact-us">contact the site administrators</a> to be authorized.</p>
                <p>
                  <div class="more-content add-organization clear-fix">
                    <a href="<?php global $user; if (!$user->uid) print '/user?destination='; ?>/node/add/organization"><span class="glyphicon glyphicon-plus"></span>Add an organization</a>
                  </div>
                </p>
              </div>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </div>

    <?php print render($content['links']); ?>

    <?php print render($content['comments']); ?>

</div>
