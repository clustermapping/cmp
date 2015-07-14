<div class="page region-cluster-dashboard" id="cluster-dashboard-subcluster">
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12 header">

                <?php print _hbs_dashboard_messages('region_cluster_subclusters_top'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>
    <div class="container cluster-composition-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Subclusters</h1>
                <?php print _hbs_dashboard_messages('region_cluster_subclusters_cluster_composition'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 cluster-listing">
                <div id="cluster-list-controls">
                    <span class="sort-label">Show Subclusters By</span>
                    <div class="btn-group">
                        <button type="button" name="clustersort" class="btn btn-default active" id="employment">Employment</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="wages">Wages</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="jobcreation">Job Creation</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="specialization">Specialization</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="timeline">Timeline</button>
                    </div>
                </div>
                <div class="col-md-12 chart chart-100 cluster-graph jobcreation-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph employment-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph wages-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph specialization-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph timeline-chart"></div>
            </div>
        </div>
    </div>
    <div class="container subclusters-composition-container last">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Subclusters</h1>
                <?php print _hbs_dashboard_messages('region_cluster_subclusters_subclusters'); ?>
            </div>
            <div class="clearfix"></div>
        </div>
    </div>
</div>