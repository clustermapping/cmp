<div class="page region-dashboard" id="region-dashboard-summary">
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('region_summary_top'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>

    <div class="container performance-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Performance and Drivers</h1>
                <?php print _hbs_dashboard_messages('region_summary_performance'); ?>
            </div>
            <div class="col-md-12 chart chart-10" style="height:60px">
                <iframe src="/data/viz/perf_legend.html#<?php print $region_type ?>" scrolling="no"></iframe> 
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-1 odd chart chart-100"><iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gdp_per_capita_tf" scrolling="no" height="200"></iframe></div>
            <div class="col-md-6 sparkline sparkline-2 even chart chart-100"><iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/unemployment_rate_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-3 odd chart chart-100"><iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/private_wage_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-4 even chart chart-100"><iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/emp_tl" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/performance" class="read-more">Explore this region’s performance and drivers <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <div class="container cluster-container">
        <div class="row no-border">
            <div class="col-md-12 header">
                <h1 class="center-block">Cluster Portfolio, 2015</h1>
<!---->
<!--                <p><strong>Cluster Strength: 38%</strong> (National Average: 24%) --><?php //print hbs_dashboard_filter_tooltip('[tooltip:2]'); ?><!--</p>-->

                <?php print _hbs_dashboard_messages('region_summary_regioncluster'); ?>

            </div>
        </div>
        <div class="row">
            <div class="col-md-12 cluster">
                <ul id="cluster-list-0" class="cluster-graph cluster-list"></ul>
            </div>
            <div class="col-md-6 pie odd"><h2 class="text-center">Traded vs. Local Clusters</h2></div>
            <div class="col-md-6 bar even"><h2 class="text-center">Top Clusters by Employment</h2></div>
            <div class="clearfix"></div>
<!--            <div class="col-md-6 sparkline sparkline-1 odd chart"><iframe src="/data/report/region/spark#/--><?php //print $region_type . '/' . $region_code ?><!--/private_wage_tf" scrolling="no"></iframe></div>-->
<!--            <div class="col-md-6 sparkline sparkline-2 even chart"><iframe src="/data/report/region/spark#/--><?php //print $region_type . '/' . $region_code ?><!--/private_wage_tf" scrolling="no"></iframe></div>-->
<!--            <div class="clearfix"></div>-->
<!--            <div class="col-md-6 sparkline sparkline-3 odd chart"><iframe src="/data/report/region/spark#/--><?php //print $region_type . '/' . $region_code ?><!--/emp_tl" scrolling="no"></iframe></div>-->
<!--            <div class="col-md-6 sparkline sparkline-4 even chart"><iframe src="/data/report/region/spark#/--><?php //print $region_type . '/' . $region_code ?><!--/emp_tl" scrolling="no"></iframe></div>-->
<!--            <div class="clearfix"></div>-->
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/cluster-portfolio" class="read-more">Dive into this region’s clusters <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <div class="container subregions-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Sub-Regions</h1>
                <?php print _hbs_dashboard_messages('region_summary_subregions'); ?>
            </div>
            <div class="col-md-6 col-md-offset-3 footer-link">
                <a href="<?php print rtrim(request_uri(), '/'); ?>/subregions" class="read-more">Dive into the sub-regions for this region <span class="more-arrow">&nbsp;→</span></a>
            </div>
        </div>
    </div>

    <div class="container related-container last">
        <div class="row">
            <div class="col-md-4">
                <h2 >Related Organizations</h2>
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
