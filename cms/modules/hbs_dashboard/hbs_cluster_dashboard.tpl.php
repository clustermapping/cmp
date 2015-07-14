<div class="page cluster-dashboard" id="cluster-dashboard-summary">
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('cluster_summary_top'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>

    <div class="container regions-container" id="cluster-region-search">
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
    
    <div class="container regions-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Top Regions</h1>
                <?php print _hbs_dashboard_messages('cluster_summary_topregions'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart chart-50 cluster-graph top-employment-chart">
                <?php print $topregions_chart ?>
            </div>
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/top-regions" class="read-more">Explore this cluster’s top regions <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <div class="container subclusters-container">
        <div class="row">
            <div class="col-md-12 header">
              <h1>Subclusters</h1>
              <?php print _hbs_dashboard_messages('cluster_summary_subclusters'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart chart-100 cluster-graph employment-chart">
                <?php print $subcluster_chart ?>
            </div>
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/subclusters" class="read-more">Dive deeper into subclusters <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <div class="container related-clusters-container">
        <div class="row">
            <div class="col-md-12 header">
              <h1>Related Clusters</h1>
              <?php print _hbs_dashboard_messages('cluster_summary_related'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart">
            </div>
        </div>
    </div>

    <div class="container related-container last">
        <div class="row">
            <div class="col-md-4">
                <h2>Related Organizations</h2>
                <?php print render($related_organizations); ?>
            </div>
            <div class="col-md-4">
                <h2>Related Blog Posts</h2>
                <?php print render($related_blogs); ?>
            </div>
            <div class="col-md-4">
                <h2>Related Resources</h2>
                <?php print render($related_resources); ?>
            </div>
        </div>
    </div>

</div>
