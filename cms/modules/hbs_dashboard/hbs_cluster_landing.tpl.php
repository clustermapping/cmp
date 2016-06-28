<div class="container dashboard-welcome-message field-name-body">
  <div class="row">
    <div class="col-xs-12 node">
      <div class="dashboard-welcome-message-content field-name-body">
        <?php print _hbs_dashboard_messages('cluster_landing_top'); ?>
      </div>
    </div>
</div>

<div class="container">
  <div class="row">
    <div class="col-md-12 cluster-listing">
        <div id="cluster-list-controls">
          <span class="sort-label">Show Clusters By</span>
          <div class="btn-group">
            <button type="button" name="clustersort" class="btn btn-default active" id="related-clusters">Relatedness</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-list">List</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-employment">Employment</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-wages">Wages</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-jobs">Job Creation</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-specialization">Specialization</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-timeline">Timeline</button>
            <button type="button" name="clustersort" class="btn btn-default" id="clusters-innovation">Innovation</button>
          </div>
        </div>
        <ul id="cluster-list-0" class="cluster-graph cluster-list"></ul>
        <div class="col-md-12 chart chart-100 cluster-graph jobcreation-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph employment-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph wages-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph specialization-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph timeline-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph innovation-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph related-chart"></div>
    </div>
  </div>
</div>