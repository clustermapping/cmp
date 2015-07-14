
<div class="container additional-content-container">
  <div class="row">
    <div class="col-md-6 community-nodes">

      <div class="recent-content recent-content-blogs">
        <h2>Recent Blogs</h2>
        <div class="row blog">
          <div class="col-sm-12">
            <?php print render($blogs); ?>
            <a href="/blog" class="read-more pull-right">Visit our blog <span class="more-arrow">&nbsp;&rarr;</span></a>
          </div>
        </div>
      </div>

      <div class="recent-content recent-content-resources">
        <h2>Recent Resources</h2>
        <div class="row resource">
          <div class="col-sm-12">
            <?php print render($resources); ?>
            <a href="/resource" class="read-more pull-right">View additional resources <span class="more-arrow">&nbsp;&rarr;</span></a>
          </div>
        </div>
      </div>

    </div>
    <div class="col-md-6">

      <div class="community-organizations">
        <h2>Organizations</h2>

        <div class="community-organizations-list">
<!--           <div class="more-content add-organization clear-fix">
            <a href="<?php //print (user_access('create organization content') ?  "/": "/user?destination=" )?>node/add/organization" ><span class="glyphicon glyphicon-plus"></span>Add an organization</a>
          </div> -->
          <?php print render($recent_orgs); ?>
          <a href="/organizations" class="read-more pull-right">View all organizations <span class="more-arrow">&nbsp;&rarr;</span></a>
        </div>

<!--         <div class="recently-created-members">
          <h4>Members <small><a href="<?php print (user_access('create member content') ?  "/": "/user?destination=" )?>node/add/member">+ Add</a></small></h4>
          <?php print render($recent_members); ?>
        </div>
 -->
      </div>

    </div>
  </div>
</div>
