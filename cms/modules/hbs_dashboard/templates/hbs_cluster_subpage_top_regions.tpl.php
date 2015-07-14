<div class="page cluster-dashboard" id="cluster-dashboard-topregions">
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('cluster_topregions_top'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>
    <div class="container regions-container last">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Top Regions</h1>
                <?php print _hbs_dashboard_messages('cluster_topregions_regions'); ?>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-12 cluster-listing">
                <div id="cluster-list-controls">
                    <span class="sort-label">Show Regions By</span>
                    <div class="btn-group">
                        <button type="button" name="clustersort" class="btn btn-default active" id="employment">Employment</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="wages">Wages</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="jobcreation">Job Creation</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="specialization">Specialization</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="timeline">Timeline</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="innovation">Innovation</button>
                    </div>
                </div>
                <div class="col-md-12 chart chart-100 cluster-graph jobcreation-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph employment-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph wages-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph specialization-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph timeline-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph innovation-chart"></div>
            </div>
        </div>
    </div>

    <div class="container regions-container last" id="cluster-region-search">
        <div class="row no-border">
            <div class="col-sm-2 text-center"></div>
            <div class="col-sm-8 text-center title">
                Dive Deeper: See data on the <?php print $cluster_name ?> Cluster in a specific region
            </div>
            <div class="col-sm-2 text-center"></div>
        </div>
        <div class="row no-border">
            <div class="input-group">
                <input title="Search region by name" quick_search_callback="hbs_cluster_autocomplete_qs_callback" placeholder="Search Region by name Zip or Keyword" class="form-control use-quicksearch form-text" autocomplete="off" type="text" id="region-cluster-input-regions" value="" size="15" maxlength="128">
                <span class="input-group-btn"><button type="submit" class="btn btn-default">Search</button></span>
            </div>
        </div>
        <div class="row no-border"> &nbsp; </div>
        <div class="clearfix"></div>
    </div>
    
</div>