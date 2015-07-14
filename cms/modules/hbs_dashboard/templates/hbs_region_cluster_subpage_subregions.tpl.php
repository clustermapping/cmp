<div class="page region-cluster-dashboard" id="region-dashboard-subregion">
    <div class="container header-container">
        <div class="row">
            <div class="col-md-12 header">
                <?php print _hbs_dashboard_messages('region_cluster_subregion_top'); ?>
            </div>
        </div>
    </div>
    <div class="container map-container">
        <div class="row">
            <div class="col-md-12">
                <?php print render($map) ?>
            </div>
        </div>
    </div>
    <div class="container sub-regional-wages-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Sub-Regions Comparative Wage Performance</h1>
                <?php print _hbs_dashboard_messages('region_cluster_subregion_wages'); ?>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-12 chart chart-100">
                <?php print render($subregions_wages) ?>
            </div>
        </div>
    </div>

    <div class="container scatterplot-container last">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Sub-Regions Comparative Employment Performance</h1>
                <?php print _hbs_dashboard_messages('region_cluster_subregion_employment_performance'); ?>
            </div>
            <div class="col-md-12 chart chart-100">
                <?php print render($subregions_employment) ?>
            </div>
        </div>
    </div>
</div>