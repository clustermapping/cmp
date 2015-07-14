<?php

/**
 * @file
 * Default simple view template to display a list of rows.
 *
 * - $title : The title of this group of rows.  May be empty.
 * - $options['type'] will either be ul or ol.
 * @ingroup views_templates
 */
  $columns = (arg(0) == 'organizations') ? 3 : 1;
  $split_rows = array_chunk($rows, ceil(count($rows) / $columns));
?>

<h2>Registry</h2>

<div class="community-list clearfix">
  <div class="community-nodes">
    <?php foreach ($split_rows as $rows): ?>
      <div class="col-sm-<?php print 12 / $columns; ?>">
        <ul>
          <?php foreach ($rows as $id => $row): ?>
            <?php
              preg_match('/\<a.*href=\"(.*?)\".*?\>(.*)\<\/a\>+/', $row, $matches);
              $link_text = str_replace('-', ' ', $matches[2]);
              $row = str_replace($matches[2], $link_text, $row);
            ?>
            <li class="<?php print $classes_array[$id]; ?>"><?php print $row; ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endforeach; ?>
  </div>
</div>
