
/**
 *  Javascript to use popup for quicksearch like select input
 */

(function ($) {
  Drupal.behaviors.hbs_solr_field = {
    attach : function (context, settings) {
      var activeInput;
      $('.field-type-hbs-solr-field-solr-reference .use-quicksearch', context).on('focus',function(){
        activeId = $(this).attr('id');
      });

      $(document).ajaxSuccess(function(event, xhr, settings) {
        $('.field-type-hbs-solr-field-solr-reference .use-quicksearch', context).each(function (index, el) {
          $('.field-type-hbs-solr-field-solr-reference .quicksearch-result-item').unbind('click').bind('click',function(){

            $('#'+activeId).attr('data-id', $('a',this).attr('id'))
              .attr('data-key', $('a',this).attr('data-key') )
              .attr('value', $('a',this).text() );
            var tmpClass = activeId.replace('edit-', '');
            $('.data-key.'+tmpClass).attr('value', $('a',this).attr('data-key') );
            $('.data-id.'+tmpClass).attr('value',  $('a',this).attr('id') );
            el.quicksearch.close();
            $('.field-type-hbs-solr-field-solr-reference .quicksearch-results .close-button').trigger('click');
          });
        });
      });
    },
  };

})(jQuery);
