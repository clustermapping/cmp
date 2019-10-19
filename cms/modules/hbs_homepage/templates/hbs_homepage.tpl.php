<?php print render($map); ?>

<?php if(!empty($jumbotron)):?>
  <div class="jumbotron">
    <?php print render($jumbotron);?>
  </div>
<?php endif; ?>


<div class="main-container">
  <div class="container primary-container">
    <div id="what-are-clusters" class="clearfix">
      <h2 class="section-head cluster-head">
        <?php print _hbs_homepage_title('first_lead'); ?>
      </h2>
      <div class="col-wrapper clearfix">
        <?php print _hbs_homepage_messages('first_lead'); ?>
      </div>
    </div><!--/what are clusters-->

      <div id="dive-in-wrapper">
        <h2 class="section-head">
          <?php print _hbs_homepage_title('second_lead'); ?>
        </h2>
        <div id="dive-in" class="content-body">
          <?php print _hbs_homepage_messages('second_lead'); ?>
        </div><!--/dive in-->

      </div><!--/dive in wrapper-->

      <div id="big-search-bar">
        <?php print render($search); ?>
      </div><!--/big search bar-->

      <div id="dive-in-wrapper">
        <h2 class="section-head">
          <?php print _hbs_homepage_title('third_lead'); ?>
        </h2>
        <div id="whos-doing" class="col-wrapper clearfix">
          <?php print _hbs_homepage_messages('third_lead'); ?>
        </div><!--/dive in-->

      </div><!--/dive in wrapper-->

  </div><!--/container-->

</div><!--/main-container-->


<div class='content-body'>
  <div class="container">
    <div class="row">
      <div class="col-md-6 about">
        <?php print render($about); ?>
      </div>

      <div class="col-md-6">
        <h2>From the Blog</h2>
        <div class="row blog">
          <div class="col-xs-3 icon"></div>
          <div class="col-xs-9">
            <?php // print render($blogs); ?>
            <a href="/blog" class="read-more">Visit our blog <span class="more-arrow">&nbsp;&rarr;</span></a>
          </div>
        </div>

        <h2>Recent Resources</h2>
        <div class="row resource">
          <div class="col-xs-3 icon">

          </div>
          <div class="col-xs-9">
            <?php //print render($resources); ?>
            <a href="/resource" class="read-more">Visit our resources <span class="more-arrow">&nbsp;&rarr;</span></a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!--
  <div class="container">
    <div class="row">
      <div class="col-lg-12 cluster-listing-header">
        <h2> <a name="clusters"></a>Cluster Categories</h2>
        <p class="sub-text">The diagram below shows the clusters with its associated number of Americans employed in that cluster.
          <strong>Click on each cluster to learn more.</strong>
        </p>
      </div>
      <?php //print render($clusters); ?>
    </div>
  </div>
  -->
</div>

