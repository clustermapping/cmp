<div class="container">
  <div class="row">
    <div class="col-md-12" id="block-hbs-viz-hbs-viz-map">
      <p>Display a map or another full-width element on all dashboard sub pages.</p>
      <img src="http://placehold.it/1000x350">
    </div>
  </div>
  <br>
  <div class="row">
    <?php foreach ($columns as $key => $column): ?>
      <div class="col-md-<?php print $column; ?> about">
        <?php print render(${'column' . ($key + 1)}); ?>
      </div>
    <?php endforeach; ?>
  </div>
</div>