<div class="container">
  <div class="row">
    <div class="col-xs-12">
      <?php print render($chart); ?>
    </div>
</div>

<div class="container regions-container" id="region-search">
    <div class="row no-border">
        <div class="input-group">
            <input title="Search region by name" quick_search_callback="hbs_cluster_autocomplete_qs_callback" placeholder="Search Region by name Zip or Keyword" class="form-control use-quicksearch form-text" autocomplete="off" type="text" id="region-landing-input-regions" value="" size="15" maxlength="128">
            <span class="input-group-btn"><button type="submit" class="btn btn-default">Search</button></span>
        </div>
    </div>
    <div class="clearfix"></div>
    <div class="row no-border"> &nbsp; </div>
</div>

<div class="container dashboard-welcome-message field-name-body">
  <div class="row">
    <div class="col-xs-12 node">
      <div class="dashboard-welcome-message-content field-name-body">
        <?php print _hbs_dashboard_messages('region_landing_top'); ?>
      </div>
    </div>
  </div>
</div>


<div class="container dashboard-welcome-message field-name-body">
  <div class="row">
    <div class="col-xs-12 node">
      <div class="dashboard-welcome-message-content field-name-body">
        <?php print _hbs_dashboard_messages('region_landing_calltoaction'); ?>
      </div>
    </div>
  </div>
</div>
