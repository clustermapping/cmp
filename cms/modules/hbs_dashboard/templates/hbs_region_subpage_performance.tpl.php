<div class="page region-dashboard" id="region-dashboard-preformance">
    <div class="container header-container">
      <div class="row">
        <div class="col-md-12 header">
            <?php print _hbs_dashboard_messages('region_performance_top'); ?>
        </div>
      </div>
    </div>

    <div class="container preformance-container">
      <div class="row">
         <div class="col-md-12 chart chart-10" style="height:60px">
            <iframe src="/data/viz/perf_legend.html#<?php print $region_type ?>" scrolling="no"></iframe> 
	</div>
        <div class="col-md-12 header">
            <div class="pull-right"><a class="btn btn-default" href="/data/report/region/performance/<?php print $region_type . '/' . $region_code ?>/png"><span class="glyphicon glyphicon-picture"></span></a></div>
            <h1>Performance</h1>
            <?php print _hbs_dashboard_messages('region_performance_performance'); ?>
            <h2>Outcomes</h2>
        </div>
        <div class="clearfix"></div>
        <div class="col-md-6 sparkline sparkline-1 odd chart chart-100">
            Prosperity / Prosperity Growth
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gdp_per_capita_tf" scrolling="no"></iframe></div>
        <div class="col-md-6 sparkline sparkline-2 even chart chart-100">
            Wages / Wage Growth
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/private_wage_tf" scrolling="no"></iframe></div>

<?php if ($region_type == 'state'): ?>
        <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
            Real Wages
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/real_per_capita_personal_income_chained_2008_dollars_tf" scrolling="no"></iframe></div>
<?php endif; ?>

        <div class="col-md-6 sparkline sparkline-3 odd chart chart-100">
            Labor Mobilization / Change in Labor Mobilization
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/labor_mobilization_tf" scrolling="no"></iframe></div>

        <div class="col-md-6 sparkline sparkline-4 even chart chart-100">
            Jobs / Job Creation
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/emp_tl" scrolling="no"></iframe></div>
        <div class="col-md-6 sparkline sparkline-5 odd chart chart-100">
            Unemployment Rate (IBRC) / Change in Unemployment
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/unemployment_rate_tf" scrolling="no"></iframe></div>

        <div class="col-md-6 sparkline sparkline-6 even chart chart-100">
            Poverty Rate (IBRC) / Change in Poverty Rate
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/poverty_rate_tf" scrolling="no"></iframe></div>
        <div class="clearfix"></div>

        <div class="col-md-12 header">
            <h2>Intermediate Outcomes</h2>
        </div>
        <div class="clearfix"></div>
        <div class="col-md-6 sparkline sparkline-7 odd chart chart-100">
            Labor Force Productivity / Labor Force Productivity Growth
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/labor_force_productivity_tf" scrolling="no"></iframe></div>
        <div class="col-md-6 sparkline sparkline-8 even chart chart-100">
            Innovation / Innovation Growth
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/innovation_tf" scrolling="no"></iframe></div>
        <div class="col-md-6 sparkline sparkline-10 even chart chart-100">
            New Business Formation
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/est_tl" scrolling="no"></iframe></div>
        <div class="clearfix"></div>

        <div class="col-md-12 header">
            <h2>International Trade &amp; Investment</h2>
        </div>
        <div class="clearfix"></div>
        <div class="col-md-6 sparkline sparkline-9 odd chart chart-100">
            Exports / Exports as a percent of GDP (IBRC)
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/exports_tf" scrolling="no"></iframe></div>

<?php if ($region_type == 'state'): ?>
        <div class="col-md-6 sparkline sparkline-9 odd chart chart-100">
            FDI
            <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/bea_foreign_employment_by_state_industry__all_industries_tf" scrolling="no"></iframe></div>
<?php endif; ?>
            
      </div>
    </div>

    <div class="container business-environment-container">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Business Environment</h1>
                <?php print _hbs_dashboard_messages('region_performance_business'); ?>

                <h2>Factor Input Conditions</h2>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-1 odd chart chart-100">
                Business Lending
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/rd_per_capita_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-2 even chart chart-100">
                Government Funding
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/federal_rd_per_capita_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-3 odd chart chart-100">
                Venture Capital / Venture Capital Growth
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/venture_capital_per_gdp_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-4 even chart chart-100">
                Scientific Degrees Awarded
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/scientific_degrees_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-5 odd chart chart-100">
                Advanced Scientific Workers / Growth in Advanced Scientific Workers
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/advanced_scientific_workers_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-6 even chart chart-100">
                Educational Attainment - Total Receiving a High School Diploma or More
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/educational_attainment_25_years_and_over_high_school_graduate_per_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-7 odd chart chart-100">
                Educational Attainment - Some College or Associates Degree
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/educational_attainment_25_years_and_over_some_college_or_associates_per_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-8 even chart chart-100">
                Educational Attainment - Total Completing a Bachelor’s Degree or More
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/educational_attainment_25_years_and_over_bachelors_per_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>


            <div class="col-md-12 header">
                <h2>Context for Firm Strategy and Rivalry</h2>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-10 odd chart chart-100">
                Unionization / Growth of Unions
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/unionization_rate_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-11 even chart chart-100">
                Tax rates, index, or other
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/taxes_per_gdp_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-10 odd chart chart-100">
                Corporate Taxes as Percent of GDP
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/corp_taxes_per_gdp_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>

            <div class="col-md-12 header">
                <h2>Related or Supporting Industries</h2>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-12 odd chart chart-100">
                Cluster Strength / Employment Growth in Strong Clusters
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/str_emp_per_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-13 even chart chart-100">
                Manufacturing Intensity / Manufacturing Jobs Growth
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/manufacturing_intensity_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>

<?php if ($region_type == 'state'): ?>
            <div class="col-md-12 header">
                <h2>Demand Conditions</h2>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-13 odd chart chart-100">
                Consumer Spending
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/personal_consumption_expenditures_per_capita_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
<?php endif; ?>

        </div>
    </div>


    <div class="container regional-structure-container last">
        <div class="row">
            <div class="col-md-12 header">
                <h1>Demographics & Geography</h1>
                <?php print _hbs_dashboard_messages('region_performance_regionalstructure'); ?>

                <h2>Population</h2>
            </div>
            <div class="clearfix"></div>

            <div class="col-md-6 sparkline sparkline-1 odd chart chart-100"">
                Population by Age - Ages 0 to 4 (Preschool)
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_ages_0_to_4_preschool_per_tf" scrolling="no"></iframe>
            </div>
            <div class="col-md-6 sparkline sparkline-1 even chart chart-100"">
                Population by Age - Ages 5 to 17 (School Age)
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_ages_5_to_17_school_age_per_tf" scrolling="no"></iframe>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-1 odd chart chart-100"">
                Population by Age - Ages 18 to 24 (College Age)
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_ages_18_to_24_college_age_per_tf" scrolling="no"></iframe>
            </div>
            <div class="col-md-6 sparkline sparkline-1 even chart chart-100"">
                Population by Age - Ages 25 to 44
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_ages_25_to_44_young_adult_per_tf" scrolling="no"></iframe>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-1 odd chart chart-100"">
                Population by Age - 45 to 64
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_45_to_64_older_adult_per_tf" scrolling="no"></iframe>
            </div>
            <div class="col-md-6 sparkline sparkline-1 even chart chart-100"">
                Population by Age - Age 65 and older
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_by_age_age_65_and_older_older_per_tf" scrolling="no"></iframe>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-2 odd chart chart-100">
                Total Population growth rate
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/total_population_gr" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-3 even chart chart-100">
                Young Adult Population Growth Rate
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/young_adult_population_gr" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-4 odd chart chart-100">
                Population Density
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/population_density_tf" scrolling="no"></iframe></div>

            <div class="col-md-6 sparkline sparkline-5 even chart chart-100">
                Net International Migration
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/net_international_migration_per_tf" scrolling="no"></iframe></div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Net Domestic Migration
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/net_domestic_migration_per_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Agricultur / GDP
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/agricultural_output_gdp_tf" scrolling="no"></iframe></div>
             <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Gov. Employment - Local Services
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gov_employment_local_services_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Gov. Employment - Federal Services
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gov_employment_federal_services_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Gov. Employment - Higher Education
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gov_employment_higher_education_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Gov. Employment - Health and Hospitals
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/gov_employment_health_hospitals_tf" scrolling="no"></iframe></div>

<?php if ($region_type == 'state'): ?>
            <div class="col-md-6 sparkline sparkline-6 odd chart chart-100">
                Military Payroll &amp; Contracts
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/military_payroll_per_capita_tf" scrolling="no"></iframe></div>
<?php endif; ?>

            <div class="clearfix"></div>

            <div class="col-md-12 header">
                <h2>Firm Demographics</h2>
            </div>
            <div class="clearfix"></div>
            <div class="col-md-6 sparkline sparkline-8 odd chart chart-100">
                Average Firm Size
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/avg_firm_size_tf" scrolling="no"></iframe></div>
            <div class="col-md-6 sparkline sparkline-9 even chart chart-100">
                HQs of Large (Fortune 1000) Firms
                <iframe src="/data/report/region/spark#/<?php print $region_type . '/' . $region_code ?>/fortune1000_tl" scrolling="no"></iframe></div>
            <div class="clearfix"></div>


        </div>
    </div>

</div>
