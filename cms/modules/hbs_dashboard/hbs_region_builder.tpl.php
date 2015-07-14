<div class="container">
    <div class="row">
        <div class="col-xs-12">
            <?php print _hbs_dashboard_messages(render($message)); ?>
        </div>
    </div>
    <div class="row">
        <div class="col-xs-12">
          <?php print render($chart); ?>
        </div>
    </div>
</div>