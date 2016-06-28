var numFormat = ',f',
  perFormat = '.2%',
  moneyFormat = '$,f',
  lqFormat = '.2f',
  colors = {
    rowA: { max: '#005059', middle: '#00858e', zero: '#00cfcf', min: '#dcf8ff', // Cluster Maps (Except for Cluster Specialization): Level Data
      palette: ['#dcf8ff', '#aae7ea', '#76dddd', '#00cfcf', '#00b0b0', '#009ba4', '#00858e', '#00727b', '#005f6b', '#005059']
    },
    rowB: { max: '#006975', middle: '#67d1dd', zero: '#ffd49f', min: '#ff5800', // Cluster Maps (Except for Cluster Specialization): Change Data
      palette: ['#ff5800', '#FF8343', '#ffaa78', '#ffd49f', '#ffffcc', '#bffcff', '#67d1dd', '#00b0b0', '#00858e', '#006975'] 
    },

    rowC: { max: '#0074ea', middle: '#76dddd', zero: '#76dddd', min: '#fffddc', // Cluster Specialization Maps
      palette: ['#fffddc', '#fffddc', '#76dddd', '#76dddd', '#76dddd', '#76dddd', '#76dddd', '#76dddd', '#0074ea', '#0074ea'] 
    },

    rowD: { max: '#1e2a79', middle: '#0074ea', zero: '#4dc5ff', min: '#dcfbff', // Regions Maps: Performance: Level Data
      palette: ['#dcfbff', '#a5eeff', '#86ddff', '#4dc5ff', '#33aaff', '#328af8', '#0074ea', '#1155cc', '#003f9e', '#1e2a79'] 
    },
    rowE: {max: '#003f9e', middle: '#5dbbff', zero: '#ffd49f', min: '#ff5800', // Regions Maps: Performance: Change Data
      palette: ['#ff5800', '#FF8343', '#ffaa78', '#ffd49f', '#ffffcc', '#90f9ff', '#5dbbff', '#0074ea', '#1155cc', '#003f9e'] 
    },

    rowF: { max: '#015742', middle: '#008e6c', zero: '#6dd1b0', min: '#e5f5f9', // Regions Maps: Business Environment: Level Data
      palette: ['#e5f5f9', '#c2e1db', '#99d8c9', '#6dd1b0', '#01c193', '#01a880', '#008e6c', '#01755a', '#00634b', '#015742'] 
    },
    rowG: {max: '#00634b', middle: '#6dd1b0', zero: '#ffd49f', min: '#ff5800', // Regions Maps: Business Environment: Change Data
      palette: ['#ff5800', '#FF8343', '#ffaa78', '#ffd49f', '#ffe4c9', '#ace1cb', '#6dd1b0', '#01a880', '#008e6c', '#00634b'] 
    },

    rowH: { max: '#4d004b', middle: '#b833bb', zero: '#8c96c6', min: '#e0ecf4', // Regions Maps: Demographics & Geography: Level Data
      palette: ['#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#a37dcf', '#a655b5', '#b833bb', '#960090', '#690066', '#4d004b'] 
    },
    rowI: {max: '#810f7c', middle: '#d574d7', zero: '#ffd49f', min: '#ff5800', // Regions Maps: Demographics & Geography: Change Data
      palette: ['#ff5800', '#FF8343', '#ffaa78', '#ffd49f', '#ffe4c9', '#f5c1ff', '#d574d7', '#b750b9', '#aa13a3', '#810f7c'] 
    },

  },
  varList = [
    {
      label: "Specialization",
      key: "specialization_tl",
      mapTypes: ['cluster'],
      colors: colors.rowC,
      format: numFormat,
      calc: true,
      calc_type: 'specialization',
      calc_source: ['cluster_emp_per_tf', 'lq_tf', 'emp_tl', 'est_tl']
    },
    {
      label: "Employment",
      subtitle: 'Private, Non-Agricultural Employment',
      key: "emp_tl",
      mapTypes: ['cluster'],
      colors: colors.rowD,
      format: numFormat,
      type: 'cagr',
      plot_type: 'cagr',
      plot_scale: 'log',
      spark_type: '1-rank',
      lookup: 'jobs',
      avg: true
    },
    {
      label: "Employment Growth Rate",
      key: "emp_gr",
      mapTypes: ['cluster'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'emp_tl',
      range_type: 'cagr'
    },
    {
      label: "Job Creation",
      key: "emp_creation_tl",
      mapTypes: ['cluster'],
      colors: colors.rowE,
      format: numFormat,
      range: true,
      range_source: 'emp_tl',
      range_type: 'simple'
    },
    {
      label: "Annual Wage",
      key: "private_wage_tf",
      mapTypes: ['cluster'],
      colors: colors.rowD,
      format: moneyFormat
    },
    {
      label: "Annual Wage Growth Rate",
      key: "private_wage_gr",
      mapTypes: ['cluster'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'private_wage_tf',
      range_type: 'cagr'
    },
    {
      label: "Location Quotient",
      key: "lq_tf",
      mapTypes: ['cluster'],
      colors: colors.rowA,
      format: lqFormat
    },
    {
      label: "Change in Location Quotient",
      key: "lq_cr",
      mapTypes: ['cluster'],
      colors: colors.rowB,
      format: perFormat,
      range: true,
      range_source: 'lq_tf',
      range_type: 'simple'
    },
    {
      label: "Establishments",
      key: "est_tl",
      mapTypes: ['cluster'],
      colors: colors.rowD,
      format: numFormat,
      type: 'simple',
      plot_type: 'cagr',
      plot_scale: 'log',
      lookup: 'new_business_formation',
      avg: true
    },
    {
      label: "Establishments Growth Rate",
      key: "est_gr",
      mapTypes: ['cluster'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'est_tl',
      range_type: 'cagr'
    },
    {
      label: "Establishment Formation",
      key: "est_creation_tl",
      mapTypes: ['cluster'],
      colors: colors.rowB,
      format: numFormat,
      range: true,
      range_source: 'est_tl',
      range_type: 'simple'
    },

    {
      label: "Prosperity",
      subtitle: 'GDP Per Capita, 2005 real dollars',
      key: "gdp_per_capita_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'prosperity'
    },

    {
      label: "Prosperity Growth",
      key: "gdp_per_capita_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'gdp_per_capita_tf',
      range_type: 'cagr'
    },

    {
      label: "Annual Wage",
      subtitle: 'Average Private Wage',
      key: "private_wage_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'wages'
    },
    {
      label: "Annual Wage Growth Rate",
      key: "private_wage_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'private_wage_tf',
      range_type: 'cagr'
    },
    {
      label: "Labor Mobilization",
      subtitle: 'Labor Force Participation Rate',
      key: "labor_mobilization_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: perFormat,
      type: 'simple',
      spark_type: '3-rank',
      lookup: 'labor_mobilization'
    },
    {
      label: "Change in Labor Mobilization",
      key: "labor_mobilization_cr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'labor_mobilization_tf',
      range_type: 'simple'
    },
    {label: "Employment Growth Rate", key: "emp_gr", mapTypes: ['performance'], colors: colors.rowE, format: perFormat, range: true, range_source: 'emp_tl', range_type: 'cagr'},
    {label: "Job Creation", key: "emp_creation_tl", mapTypes: ['performance'], colors: colors.rowD, format: numFormat, range: true, range_source: 'emp_tl', range_type: 'simple'},
    {
      label: "Unemployment",
      subtitle: 'Unemployment Rate',
      key: "unemployment_rate_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: perFormat,
      type: 'simple',
      reverse_color: true,
      spark_type: '3-rank',
      lookup: 'unemployment'
    },
    {
      label: "Change in Unemployment",
      key: "unemployment_rate_cr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'unemployment_rate_tf',
      range_type: 'simple'
    },
    {
      label: "Poverty Rate",
      key: "poverty_rate_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: perFormat,
      type: 'simple',
      spark_type: '3-rank',
      reverse_color: true,
      lookup: 'poverty'
    },
    {
      label: "Change in Poverty Rate",
      key: "poverty_rate_cr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'poverty_rate_tf',
      range_type: 'simple'
    },
    {
      label: "Labor Force Productivity",
      subtitle: 'Real GDP, 2005 dollars, per Labor Force Participant',
      key: "labor_force_productivity_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'labor_force_productivity'
    },
    {
      label: "Labor Force Productivity Growth",
      key: "labor_force_productivity_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'labor_force_productivity_tf',
      range_type: 'cagr'
    },
    {
      label: "Innovation",
      subtitle:'Utility Patents per 10k employees',
      key: "innovation_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: lqFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'innovation'
    },
    {
      label: "Innovation Growth",
      key: "innovation_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'innovation_tf',
      range_type: 'cagr'
    },
    {
      label: "Patent Count",
      key: "patent_count_tf",
      mapTypes: ['performance', 'cluster'],
      colors: colors.rowD,
      format: numFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'patent_count'
    },
    {
      label: "Patent Count Growth",
      key: "patent_count_gr",
      mapTypes: ['performance', 'cluster'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'patent_count_tf',
      range_type: 'cagr'
    },
    {
      label: "Exports",
      subtitle: 'Exports as a percent of GDP',
      key: "exports_tf",
      mapTypes: ['performance'],
      colors: colors.rowD,
      format: perFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'exports'
    },
    {
      label: "Exports Growth",
      key: "exports_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'exports_tf',
      range_type: 'cagr'
    },
    {
      label: "Establishments Growth Rate",
      key: "est_gr",
      mapTypes: ['performance'],
      colors: colors.rowE,
      format: perFormat,
      range: true,
      range_source: 'est_tl',
      range_type: 'cagr'
    },
    {
      label: "R&D Expenditure per Capita",
      subtitle: 'Total R&D Expenditures per Capita',
      key: "rd_per_capita_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'rd_expenditure'
    },
    {
      label: "R&D Expenditure per Capita Growth",
      key: "rd_per_capita_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'rd_per_capita_tf',
      range_type: 'cagr'
    },
    {
      label: "Federal Funding for R&D per Capita",
      subtitle: 'Federal Government Funding for R&D',
      key: "federal_rd_per_capita_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'federal_rd_expenditure'
    },
    {
      label: "Federal Funding for R&D per Capita Growth",
      key: "federal_rd_per_capita_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'federal_rd_per_capita_tf',
      range_type: 'cagr'
    },
    {
      label: "Venture Capital",
      subtitle: 'Venture Capital per $10,000 GDP',
      key: "venture_capital_per_gdp_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: moneyFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'venture'
    },
    {
      label: "Venture Capital Growth",
      key: "venture_capital_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'venture_capital_per_gdp_tf',
      range_type: 'cagr'
    },
    {
      label: "Scientific Degrees Awarded",
      subtitle: 'Total Science & Engineering Doctorates Awarded',
      key: "scientific_degrees_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: numFormat,
      type: 'level',
      spark_type: '1-rank',
      lookup: 'scientific_degrees'
    },
    {
      label: "Advanced Scientific Workers",
      subtitle: 'Employed Science, Engineering and Health Doctoral Holders as Percent of Population',
      key: "advanced_scientific_workers_tf",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'advanced_scientific_workers'
    },
    {
      label: "Growth in Advanced Scientific Workers",
      key: "advanced_scientific_workers_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'total_employed_science_engineering_doctoral_holders_tf',
      range_type: 'cagr'
    },
    {
      label: "Total Receiving High School Diploma or More",
      subtitle: "Percentage of population over 25 years old",
      key: "educational_attainment_25_to_64_high_school_graduate_per_tf",
      lookup: "educational_high_school",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "Total with Some College or Associates Degree or More",
      subtitle: "Percentage of population over 25 years old",
      key: "educational_attainment_25_to_64_some_college_or_associates_per_tf",
      lookup: "educational_college",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "Total Completing a Bachelor's Degree or More",
      subtitle: "Percentage of population over 25 years old",
      key: "educational_attainment_25_to_64_bachelors_per_tf",
      lookup: "educational_bachelor",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "Unionization",
      subtitle: 'Percent of Workers Represented by Unions',
      key: "unionization_rate_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'cagr',
      spark_type: '3-rank',
      lookup: 'unionization'
    },
    {
      label: "Growth of Unions",
      key: "unionization_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'unions_members_tf',
      range_type: 'cagr'
    },
    {
      label: "Taxes as Percent of GDP",
      subtitle: 'State and Local Taxes as Percent of GDP',
      key: "taxes_per_gdp_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'level',
      spark_type:'1-rank',
      lookup: 'taxes'
    },
    {
      label: "Corporate Taxes as Percent of GDP",
      subtitle: 'State and Local Net Income Tax as Percent of GDP',
      key: "corp_taxes_per_gdp_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'level',
      spark_type:'1-rank',
      lookup: 'corporate_taxes'
    },
    {
      label: "Cluster Strength",
      subtitle: 'Percent of Traded Employment in Strong Clusters',
      key: "str_emp_per_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'cagr',
      plot_key: 'str_emp_tl',
      spark_type: '3-rank',
      lookup: 'cluster_strength'
    },
    {
      label: "Employment Growth in Strong Clusters",
      key: "str_emp_gr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'str_emp_tl',
      range_type: 'cagr'
    },
    {
      label: "Manufacturing Intensity",
      subtitle: 'Manufacturing jobs as a percent of all jobs',
      key: "manufacturing_intensity_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      type: 'simple',
      spark_type: '3-rank',
      lookup: 'manufacturing_intensity'},
    {
      label: "Change in Manufacturing Intensity",
      key: "manufacturing_intensity_cr",
      mapTypes: ['business'],
      colors: colors.rowG,
      format: perFormat,
      range: true,
      range_source: 'est_tl',
      range_type: 'simple'
    },
    {
      label: "Consumer Spending",
      subtitle: 'Personal Consumption Expenditure per capita',
      key: "personal_consumption_expenditures_per_capita_tf",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: moneyFormat,
      lookup: 'consumer_spending',
      range: false,
      spark_type: '3-rank',
      type: 'cagr',
    },
    {
      label: "FDI",
      subtitle: 'Jobs created through FDI',
      key: "bea_foreign_employment_by_state_industry__all_industries_tf",
      lookup: "bea_foreign_employment",
      mapTypes: ['performance'],
      colors: colors.rowF,
      format: numFormat,
      range: false,
      spark_type: '3-rank',
      type: 'cagr',
    },
    {
      label: "Agriculture / GDP",
      subtitle: "Agriculture Output / GDP",
      key: "agricultural_output_gdp_tf",
      lookup: "agricultural_output_gdp",
      mapTypes: ['business'],
      colors: colors.rowF,
      format: perFormat,
      range: false,
      spark_type: '3-rank',
      type: 'cagr',
    },
    {
      label: "Gov. Employment - Local Services",
      key: "gov_employment_local_services_tf",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: numFormat,
      range: false,
      spark_type: '1-rank',
      type: 'level',
    },
    {
      label: "Gov. Employment - Federal Services",
      key: "gov_employment_federal_services_tf",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: numFormat,
      range: false,
      spark_type: '1-rank',
      type: 'level',
    },
    {
      label: "Gov. Employment - Higher Education",
      key: "gov_employment_higher_education_tf",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: numFormat,
      range: false,
      spark_type: '1-rank',
      type: 'level',
    },
    {
      label: "Gov. Employment - Health and Hospitals",
      key: "gov_employment_health_hospitals_tf",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: numFormat,
      range: false,
      spark_type: '1-rank',
      type: 'level',
    },
    {
      label: "Military Payroll & Contracts",
      subtitle: "Total military payroll & contracts per capita",
      key: "military_payroll_per_capita_tf",
      lookup: "military_payroll_per_capita",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: moneyFormat,
      range: false,
      spark_type: '1-rank',
      type: 'level',
    },
    {
      label: "Real Wages (2008 dollars)",
      subtitle: "Price-adjusted personal income per capita",
      key: "real_per_capita_personal_income_chained_2008_dollars_tf",
      mapTypes: ['structure'],
      colors: colors.rowF,
      format: moneyFormat,
      lookup: 'real_income',
      range: false,
      spark_type: '1-rank',
      type: 'cagr',
    },
    {
      label: "Population by Age - Ages 0 to 4 (Preschool)",
      subtitle: "Percentage of population",
      key: "population_by_age_ages_0_to_4_preschool_per_tf",
      lookup: "population_preschool",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      label: "Population by Age - Ages 5 to 17 (School Age)",
      subtitle: "Percentage of population",
      key: "population_by_age_ages_5_to_17_school_age_per_tf",
      lookup: "population_school",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      label: "Population by Age - Ages 18 to 24 (College Age)",
      subtitle: "Percentage of population",
      key: "population_by_age_ages_18_to_24_college_age_per_tf",
      lookup: "population_college",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      label: "Population by Age - Ages 25 to 44 (Young Adult)",
      subtitle: "Percentage of population",
      key: "population_by_age_ages_25_to_44_young_adult_per_tf",
      lookup: "population_young_adult",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      label: "Population by Age - Ages 45 to 64 (Older Adult)",
      subtitle: "Percentage of population",
      key: "population_by_age_45_to_64_older_adult_per_tf",
      lookup: "population_older_adult",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      label: "Population by Age - Ages 65 and Older (Older Adult)",
      subtitle: "Percentage of population",
      key: "population_by_age_age_65_and_older_older_per_tf",
      lookup: "population_older",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: perFormat,
      type: 'level',
      spark_type: 'no-rank',
      benchmark: true
    },
    {
      colors: colors.rowH,
      format: numFormat,
      key: "total_population_tf",
      label: "Total Population",
      mapTypes: [],
      plot_type: 'cagr',
      plot_scale: 'log',
      range: false,
      spark_type: '1-rank',
      spark_end_format: numFormat,
      type: 'cagr',
    },
    {
     label: "Total Population Growth",
      key: "total_population_gr",
      lookup: "total_population_gr",
      mapTypes: ['structure'],
      colors: colors.rowI,
      format: numFormat,
      range: true,
      range_source: 'total_population_tf',
      range_type: 'cagr',
      type: 'cagr',
      spark_type: '1-rank',
      spark_end_format: numFormat,
      plot_scale:'log'
    },
    {
      label: "Young Adult Population Growth",
      key: "young_adult_population_gr",
      lookup: "young_adult_population",
      mapTypes: ['structure'],
      colors: colors.rowI,
      format: numFormat,
      range: true,
      range_source: 'population_by_age_ages_25_to_44_young_adult_tf',
      range_type: 'cagr',
      type: 'cagr',
      spark_type: '1-rank',
      spark_end_format: numFormat,
      plot_scale:'log'
    },
    {
      label: "Population Density",
      subtitle: "Population per sq. mile",
      key: "population_density_tf",
      lookup: "population_density",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: numFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "Net International Migration",
      subtitle: 'As percent of total population',
      key: "net_international_migration_per_tf",
      lookup: "net_international_migration",
      mapTypes: ['structure'],
      colors: colors.rowI,
      format: perFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "Net Domestic Migration",
      subtitle: 'As percent of total population',
      key: "net_domestic_migration_per_tf",
      lookup: "net_domestic_migration",
      mapTypes: ['structure'],
      colors: colors.rowI,
      format: perFormat,
      type: 'level',
      spark_type: '1-rank'
    },
    {
      label: "Average Firm Size",
      subtitle: 'Average traded establishment size',
      key: "avg_firm_size_tf",
      lookup: "avg_firm_size",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: numFormat,
      type: 'level',
      spark_type: '1-rank',
      benchmark: true
    },
    {
      label: "HQ of Large (Fortune 1000) Firms",
      key: "fortune1000_tl",
      mapTypes: ['structure'],
      colors: colors.rowH,
      format: numFormat,
      type: 'level',
      spark_type: 'none',
      lookup: 'hqs_of_large_firms',
      plot: 'table'
    }
  ],
  stateMapping = {
    AL: '01',
    AK: '02',
    AZ: '04',
    AR: '05',
    CA: '06',
    CO: '08',
    CT: '09',
    DE: '10',
    DC: '11',
    FL: '12',
    GA: '13',
    HI: '15',
    ID: '16',
    IL: '17',
    IN: '18',
    IA: '19',
    KS: '20',
    KY: '21',
    LA: '22',
    ME: '23',
    MD: '24',
    MA: '25',
    MI: '26',
    MN: '27',
    MS: '28',
    MO: '29',
    MT: '30',
    NE: '31',
    NV: '32',
    NH: '33',
    NJ: '34',
    NM: '35',
    NY: '36',
    NC: '37',
    ND: '38',
    OH: '39',
    OK: '40',
    OR: '41',
    PA: '42',
    RI: '44',
    SC: '45',
    SD: '46',
    TN: '47',
    TX: '48',
    UT: '49',
    VT: '50',
    VA: '51',
    WA: '53',
    WV: '54',
    WI: '55',
    WY: '56',
    PR: '72',
    VI: '78'
  };

module.exports = {
  varTypes: [
    {label: "Performance", key: "performance" },
    {label: "Business Environment", key: "business" },
    {label: "Demographics & Geography", key: "structure"}
  ],
  vars: varList,
  colors: colors,
  stateIdMapping: stateMapping
};
