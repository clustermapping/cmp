<div class="page region-dashboard" id="region-dashboard-clusters">
    <div class="container cluster-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('region_regioncluster_top'); ?>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-12 cluster-listing">
                <div id="cluster-list-controls">
                    <span class="sort-label">Show Clusters By</span>
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

    <div class="container cluster-container">
        <div class="row">

            <div class="clearfix"></div>
            <div class="col-md-12 header">
                <h1>Cluster Portfolio, 2015</h1>

            </div>
            <div class="col-md-12">
                <ul id="cluster-list-0" class="cluster-graph cluster-list"></ul>
            </div>

            <div class="clearfix"></div>
            <div class="col-md-6 pie odd"><h2 class="text-center">Traded vs. Local Clusters</h2></div>
            <div class="col-md-6 bar even"><h2 class="text-center">Top Clusters by Employment</h2></div>


        </div>
    </div>

    <p style="position:relative;visibility:hidden;"><a id="related-clusters" name="related-clusters"> </a></p>
    <div class="container related-clusters-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Related Clusters</h1>
                <?php print _hbs_dashboard_messages('region_regioncluster_related'); ?>
                <div class="col-md-12 chart" style="height:600px;width:1024px;margin:0 auto;">
                    <?php print $relatedclusters_chart; ?>
                </div>
            </div>
        </div>
    </div>

    <div class="container related-clusters-container last">
        <div class="row">
            <div class="col-md-12 header">
                <h1 id="innovation-table">Innovation</h1>
                <?php print _hbs_dashboard_messages('region_regioncluster_innovation'); ?>

            </div>
            <div class="clearfix"></div>

            <div class="col-md-12 company-innovation-list cluster-graph cluster-list chart chart-100">
            </div>
        </div>
    </div>

</div>
