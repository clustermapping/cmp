<div class="menu section-menu <?php print $menu_classes; ?>">
  <?php if ($label): ?>
    <h4><?php print $label; ?></h4>
  <?php endif; ?>
  <ul class="nav nav-pills nav-stacked">
    <?php foreach($links as $link): ?>
      <li><?php print $link; ?></li>
    <?php endforeach; ?>
  </ul>
</div>
