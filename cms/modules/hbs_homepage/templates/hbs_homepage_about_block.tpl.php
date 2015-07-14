<div class="node node-page node-teaser clearfix">
  <h2><?php print l(t('About the Project'), 'about'); ?></h2>
  <div class="content-wrapper">
	  <div class="content">
	    <div class="field field-name-body lead">
        <?php
          if (empty($term->field_homepage_teaser)) {
            print _filter_html(text_summary($term->description), $term->format);
          }
          else {
            print text_summary($term->field_homepage_teaser[LANGUAGE_NONE][0]['safe_value']);
          }
        ?>
	      <?php  ?>
	    </div>
	  </div>

	  <ul class="links list-inline">
	    <li class="node-readmore first last"><?php print l(t('Read more'), 'about', array('attributes' => array('title' => $term->name, 'rel' => 'tag', 'class' => "read-more"))); ?></li>
	  </ul>
  </div>
</div>