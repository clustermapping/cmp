<div class="filters topic-filters">
  <h4><?php print $block_label; ?></h4>
  <ul class="nav nav-pills nav-stacked">
    <li><a href="<?php print url($type); ?>" <?php if($active == 'all') print 'class="active"'; ?>>All <?php print $block_label; ?></a></li>
    <?php foreach($terms as $term): ?>
      <li><a <?php if($active == $term->tid) print 'class="active"'; ?> href="<?php print url($type . '/' . $vocabulary . '/' . $term->tid); ?>"><?php print $term->name; ?></a></li>
    <?php endforeach; ?>
    <?php if (!empty($footer_path)): ?>
      <li><a href="<?php print $footer_path; ?>"><?php print $footer_text; ?></a></li>
    <?php endif; ?>
  </ul>
</div>
