<?php if ($user_login_block): ?>
<div class="container dashboard-welcome-message field-name-body">
  <div class="row">
    <div class="col-xs-12 node">
      <div class="dashboard-welcome-message-content field-name-body"><?php 
        print render($user_login_block);
        ?></div>
    </div>
  </div>
</div>
<?php else : ?>
<div class="container">
  <div class="row">
    <div class="col-md-12 cluster-listing">
        <!-- <button class="btn btn-info pull-right" id="region-compare-add"> Add Region </button> -->
        <div id="region-compare-controls">
          <div class="btn-group">
            <button type="button" class="btn btn-default" id="employment">Employment</button>
            <button type="button" class="btn btn-default" id="wages">Wages</button>
            <button type="button" class="btn btn-default" id="jobcreation">Job Creation</button>
          </div>
        </div>
        <ul id="comp-list-0" class="comp-graph comp-list"></ul>
        <div class="col-md-12 chart chart-100 cluster-graph jobcreation-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph employment-chart"></div>
        <div class="col-md-12 chart chart-100 cluster-graph wages-chart"></div>
    </div>

      <div class="clearfix"></div>

    <div class="container performance-container">
      <div class="row">
          <div class="col-md-12 chart" style="height:60px;margin-top: 20px;padding: 0 20px;">
              <iframe src="/data/viz/perf_legend.html" scrolling="no"></iframe> 
          </div>
          <div class="clearfix"></div>

            <?php
            if (is_array($regions)): 
              $i = 0;
              foreach ($indicators as $ikey => $indicator): ?>
                <div class="indicator-<?php print($i % 2 ? 'odd':'even' ) ?> clearfix">
                  <h3 class="text-center"> Compare <?php print $indicator ?></h3>
                <?php foreach ($regions as $r => $region): ?>
                  <div class="col-md-6 sparkline chart"><iframe src="/data/report/region/spark#/compare/<?php print $code .'/'. $ikey .'/' .$r.','.($i%2?'odd':'even') ?>" scrolling="no" height="200"></iframe></div>
                <?php endforeach; ?>
                </div>
              <?php 
                $i++;
              endforeach; ?>
            <?php endif; ?>

          <div class="col-md-6 col-md-offset-3 footer-link">
            <!-- <a class="btn btn-info" href="/compare/indicator"> Add Indicator </a> -->
          </div>

      </div>

    </div>
  </div>
</div>
<?php endif ?>