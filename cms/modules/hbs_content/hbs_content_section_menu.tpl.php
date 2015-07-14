<div class="menu section-menu">
  <h4><?php print $term->name; ?></h4>
  <ul class="nav nav-pills nav-stacked">
    <?php foreach($nodes as $node): ?>
      <li><a href="/<?php print drupal_get_path_alias('node/' . $node->nid); ?>"<?php if ($node->active) print 'class="active"';?>><?php print $node->title;?></a></li>
    <?php endforeach; ?>
  </ul>
</div>
