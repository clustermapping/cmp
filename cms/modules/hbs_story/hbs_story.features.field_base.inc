<?php
/**
 * @file
 * hbs_story.features.field_base.inc
 */

/**
 * Implements hook_field_default_field_bases().
 */
function hbs_story_field_default_field_bases() {
  $field_bases = array();

  // Exported field_base: 'field_story_cluster'
  $field_bases['field_story_cluster'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_story_cluster',
    'foreign keys' => array(
      'format' => array(
        'columns' => array(
          'format' => 'format',
        ),
        'table' => 'filter_format',
      ),
    ),
    'indexes' => array(
      'format' => array(
        0 => 'format',
      ),
    ),
    'locked' => 0,
    'module' => 'text',
    'settings' => array(
      'max_length' => 255,
    ),
    'translatable' => 0,
    'type' => 'text',
  );

  // Exported field_base: 'field_story_highlighted_areas'
  $field_bases['field_story_highlighted_areas'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_story_highlighted_areas',
    'foreign keys' => array(
      'format' => array(
        'columns' => array(
          'format' => 'format',
        ),
        'table' => 'filter_format',
      ),
    ),
    'indexes' => array(
      'format' => array(
        0 => 'format',
      ),
    ),
    'locked' => 0,
    'module' => 'text',
    'settings' => array(
      'max_length' => 255,
    ),
    'translatable' => 0,
    'type' => 'text',
  );

  // Exported field_base: 'field_story_map_key'
  $field_bases['field_story_map_key'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_story_map_key',
    'foreign keys' => array(),
    'indexes' => array(
      'value' => array(
        0 => 'value',
      ),
    ),
    'locked' => 0,
    'module' => 'list',
    'settings' => array(
      'allowed_values' => array(
        'advanced_scientific_workers_tf' => 'Advanced Scientific Workers',
        'private_wage_tf' => 'Annual Wage',
        'private_wage_gr' => 'Annual Wage Growth Rate',
        'avg_firm_size_tf' => 'Average Firm Size',
        'labor_mobilization_cr' => 'Change in Labor Mobilization',
        'lq_cr' => 'Change in Location Quotient',
        'manufacturing_intensity_cr' => 'Change in Manufacturing Intensity',
        'poverty_rate_cr' => 'Change in Poverty Rate',
        'unemployment_rate_cr' => 'Change in Unemployment',
        'str_emp_per_tf' => 'Cluster Strength',
        'corp_taxes_per_gdp_tf' => 'Corporate Taxes as Percent of GDP',
        'emp_tl' => 'Employment',
        'emp_gr' => 'Employment Growth Rate',
        'str_emp_gr' => 'Employment Growth in Strong Clusters',
        'est_creation_tl' => 'Establishment Formation',
        'est_tl' => 'Establishments',
        'est_gr' => 'Establishments Growth Rate',
        'exports_tf' => 'Exports',
        'exports_gr' => 'Exports Growth',
        'federal_rd_per_capita_tf' => 'Federal Funding for R&D per Capita',
        'federal_rd_per_capita_gr' => 'Federal Funding for R&D per Capita Growth',
        'advanced_scientific_workers_gr' => 'Growth in Advanced Scientific Workers',
        'unionization_gr' => 'Growth of Unions',
        'fortune1000_tl' => 'HQ of Large (Fortune 1000) Firms',
        'innovation_tf' => 'Innovation',
        'innovation_gr' => 'Innovation Growth',
        'emp_creation_tl' => 'Job Creation',
        'labor_force_productivity_tf' => 'Labor Force Productivity',
        'labor_force_productivity_gr' => 'Labor Force Productivity Growth',
        'labor_mobilization_tf' => 'Labor Mobilization',
        'lq_tf' => 'Location Quotient',
        'manufacturing_intensity_tf' => 'Manufacturing Intensity',
        'net_domestic_migration_tf' => 'Net Domestic Migration',
        'net_international_migration_tf' => 'Net International Migration',
        'population_density_tf' => 'Population Density',
        'population_by_age_45_to_64_older_adult_per_tf' => 'Population by Age - Ages 45 to 64 (Older Adult)',
        'population_by_age_age_65_and_older_older_per_tf' => 'Population by Age - Ages 65 and Older (Older Adult)',
        'population_by_age_ages_0_to_4_preschool_per_tf' => 'Population by Age - Ages 0 to 4 (Preschool)',
        'population_by_age_ages_18_to_24_college_age_per_tf' => 'Population by Age - Ages 18 to 24 (College Age)',
        'population_by_age_ages_25_to_44_young_adult_per_tf' => 'Population by Age - Ages 25 to 44 (Young Adult)',
        'population_by_age_ages_5_to_17_school_age_per_tf' => 'Population by Age - Ages 5 to 17 (School Age)',
        'poverty_rate_tf' => 'Poverty Rate',
        'gdp_per_capita_tf' => 'Prosperity',
        'gdp_per_capita_gr' => 'Prosperity Growth',
        'rd_per_capita_tf' => 'R&D Expenditure per Capita',
        'rd_per_capita_gr' => 'R&D Expenditure per Capita Growth',
        'scientific_degrees_tf' => 'Scientific Degrees Awarded',
        'specialization_tl' => 'Specialization',
        'taxes_per_gdp_tf' => 'Taxes as Percent of GDP',
        'educational_attainment_25_to_64_bachelors_per_tf' => 'Total Completing a Bachelor\'s Degree or More',
        'total_population_gr' => 'Total Population Growth',
        'educational_attainment_25_to_64_high_school_graduate_per_tf' => 'Total Receiving High School Diploma or More',
        'educational_attainment_25_to_64_some_college_or_associates_per_tf' => 'Total with Some College or Associates Degree or More',
        'unemployment_rate_tf' => 'Unemployment',
        'unionization_rate_tf' => 'Unionization',
        'venture_capital_per_gdp_tf' => 'Venture Capital',
        'venture_capital_gr' => 'Venture Capital Growth',
        'young_adult_population_gr' => 'Young Adult Population Growth',
      ),
      'allowed_values_function' => '',
    ),
    'translatable' => 0,
    'type' => 'list_text',
  );

  // Exported field_base: 'field_story_region_type'
  $field_bases['field_story_region_type'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_story_region_type',
    'foreign keys' => array(),
    'indexes' => array(
      'value' => array(
        0 => 'value',
      ),
    ),
    'locked' => 0,
    'module' => 'list',
    'settings' => array(
      'allowed_values' => array(
        'economic' => 'Economic',
        'state' => 'State',
      ),
      'allowed_values_function' => '',
    ),
    'translatable' => 0,
    'type' => 'list_text',
  );

  // Exported field_base: 'field_story_year'
  $field_bases['field_story_year'] = array(
    'active' => 1,
    'cardinality' => 1,
    'deleted' => 0,
    'entity_types' => array(),
    'field_name' => 'field_story_year',
    'foreign keys' => array(),
    'indexes' => array(),
    'locked' => 0,
    'module' => 'date',
    'settings' => array(
      'cache_count' => 4,
      'cache_enabled' => 0,
      'granularity' => array(
        'day' => 0,
        'hour' => 0,
        'minute' => 0,
        'month' => 0,
        'second' => 0,
        'year' => 'year',
      ),
      'timezone_db' => '',
      'todate' => 'optional',
      'tz_handling' => 'none',
    ),
    'translatable' => 0,
    'type' => 'datetime',
  );

  return $field_bases;
}
