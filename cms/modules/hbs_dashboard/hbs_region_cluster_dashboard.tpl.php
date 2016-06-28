<div class="page region-cluster-dashboard" id="cluster-dashboard-summary">
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('region_cluster_summary_top'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>

    <div class="container regions-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Region-Cluster Performance</h1>
                <?php print _hbs_dashboard_messages('region_cluster_summar_performance'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart chart-100">
                <div id="cluster-list-controls">
                    <span class="sort-label">Show Subclusters By</span>
                    <div class="btn-group">
                        <button type="button" name="clustersort" class="btn btn-default active" id="employment">Employment</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="wages">Wages</button>
                        <button type="button" name="clustersort" class="btn btn-default" id="jobcreation">Job Creation</button>
                    </div>
                </div>
                <div class="col-md-12 chart chart-100 cluster-graph jobcreation-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph employment-chart"></div>
                <div class="col-md-12 chart chart-100 cluster-graph wages-chart"></div>
            </div>
        </div>
    </div>

    <div class="container subclusters-container">
        <div class="row">
            <div class="col-md-12 header">
              <h1>Subclusters</h1>

              <?php print _hbs_dashboard_messages('region_cluster_summary_subclusters'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart chart-100">
                <?php print $subcluster_chart ?>
            </div>
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/subclusters" class="read-more">Dive deeper into subclusters <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <p style="position:relative;visibility:hidden;"><a id="related-clusters" name="related-clusters"> </a></p>
    <div class="container related-clusters-container">
        <div class="row">
            <div class="col-md-12 header">
              <h1>Related Clusters</h1>
              <?php print _hbs_dashboard_messages('cluster_summary_related'); ?>
            </div>
            <div class="clearfix"></div>
        <?php if ($relatedclusters_chart): ?>
            <div class="col-md-12 chart" style="height:800px;width:960px;margin:0 auto;">
                <?php print $relatedclusters_chart; ?>
            </div>
        <?php else: ?>
          <?php print _hbs_dashboard_messages('cluster_related_empty'); ?>
        <?php endif ?>
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
