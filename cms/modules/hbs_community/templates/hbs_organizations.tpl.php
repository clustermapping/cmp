<div class="container dashboard-welcome-message field-name-body">
  <div class="row">
    <div class="col-xs-12 node">
      <div class="dashboard-welcome-message-content field-name-body">
        <?php print _hbs_dashboard_messages('organization_summary_top'); ?>
      </div>
    </div>
</div>

<div class="container primary-container">
  <div class="row">
    <section id="content-section" class="col-sm-12">
      <?php print render($map); ?>
    </section>
  </div>
</div>

