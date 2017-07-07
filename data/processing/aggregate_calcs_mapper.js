var d3 = require('d3');

function create_importer(clusterData, clusters) {

  function calc_prosperity(a) {
    if (a.gross_domestic_product_tf && a.total_population_tf) {
      a.gdp_per_capita_tf = a.gross_domestic_product_tf / a.total_population_tf;
    }
  }

  function calc_labor_mobilization(a) {
    var working_pop_sum = 0;
    if (a.labor_force_nsa_tf) {
      if (a.population_by_age_45_to_64_older_adult_tf) {
        working_pop_sum += a.population_by_age_45_to_64_older_adult_tf;
      }

      if (a.population_by_age_ages_18_to_24_college_age_tf) {
        working_pop_sum += a.population_by_age_ages_18_to_24_college_age_tf;
      }

      if (a.population_by_age_ages_25_to_44_young_adult_tf) {
        working_pop_sum += a.population_by_age_ages_25_to_44_young_adult_tf;
      }

      a.labor_mobilization_tf = a.labor_force_nsa_tf / working_pop_sum;
    }
  }

  function calc_unemployment(a) {
    if (a.employed_nsa_tf && a.unemployed_nsa_tf) {
      a.unemployment_rate_tf = a.unemployed_nsa_tf / (a.unemployed_nsa_tf + a.employed_nsa_tf);
    }
  }

  function calc_laborforce_productivity(a) {
    if (a.labor_force_nsa_tf && a.gross_domestic_product_tf) {
      a.labor_force_productivity_tf = a.gross_domestic_product_tf/a.labor_force_nsa_tf;
    }
  }

  function calc_innovation(a) {
    if (a.utility_patents_tf && a.emp_tl) {
      a.innovation_tf = a.utility_patents_tf / (a.emp_tl/10000);
    }
  }


  function calc_exports(a) {
    if(a.total_exports_over_time_tf && a.gross_domestic_product_tf) {
      a.exports_tf = a.total_exports_over_time_tf / a.gross_domestic_product_tf;
    }
  }

  function calc_scientific_degrees(a) {
    if(a.science_and_engineering_graduates_from_state_institutions_science_tf
      && a.science_and_engineering_graduates_from_state_institutions_engineering_tf) {
      a.scientific_degrees_tf = a.science_and_engineering_graduates_from_state_institutions_science_tf
        + a.science_and_engineering_graduates_from_state_institutions_science_tf;
    }
  }

  function calc_rd(a) {
    if (a.total_rd_expenditures_tf && a.total_population_tf) {
      a.rd_per_capita_tf = a.total_rd_expenditures_tf /  a.total_population_tf;
    }
  }

  function calc_federal_rd(a) {
    if (a.academic_rd_funding_at_public_universities_by_source_federal_govt_tf
      && a.academic_rd_funding_at_private_universities_by_source_federal_govt_tf
      && a.total_population_tf) {
      a.federal_rd_per_capita_tf = (a.academic_rd_funding_at_public_universities_by_source_federal_govt_tf
        + a.academic_rd_funding_at_private_universities_by_source_federal_govt_tf) /  a.total_population_tf;
    }
  }

  function calc_taxes(a) {
    if (a.gross_domestic_product_tf && a.state_and_local_revenue_total_tax_tf) {
      a.taxes_per_gdp_tf = a.state_and_local_revenue_total_tax_tf / a.gross_domestic_product_tf;
    }
  }

  function calc_corp_taxes(a) {
    if (a.gross_domestic_product_tf && a.state_and_local_revenue_corporate_net_income_tax_tf) {
      a.corp_taxes_per_gdp_tf = a.state_and_local_revenue_corporate_net_income_tax_tf / a.gross_domestic_product_tf;
    }
  }

  function calc_unionization(a) {
    if (a.unions_members_tf && a.employed_nsa_tf) {
      a.unionization_rate_tf = a.unions_members_tf / a.employed_nsa_tf * 1000;
    }
  }

  function calc_manufacturing_intensity(a) {
    if (a.total_payroll_jobs_qcew_tf && a.manufacturing_jobs_qcew_tf) {
      a.manufacturing_intensity_tf = a.manufacturing_jobs_qcew_tf / a.total_payroll_jobs_qcew_tf;
    }
  }

  function calc_pop_density(a) {
    if (a.land_area_in_sq_miles_tf && a.total_population_tf) {
      a.population_density_tf = a.total_population_tf / a.land_area_in_sq_miles_tf;
    }
  }

  function calc_firm_size(a) {
    if (a.emp_tl && a.est_tl) {
      a.avg_firm_size_tf = a.emp_tl / a.est_tl;
    }
  }

  function clustersForRegion(type, code, year) {
    var regionClusters = [], found= 0, notfound=0;
    clusterData.forEach(function (_k, v) {
      var ids = ['cluster', type, code, v.cluster_code_t, year], key, c;
      if (v.sub_code_t) {
        ids.push(v.sub_code_t);
      }
      key = ids.join('/');

      c = clusters.get(key);
      if (!c) {
//        console.log('\t cluster not found:\t', key);
        notfound++;
      } else {
        found++;
      }

      regionClusters.push(c);
    });
//    console.log("Clusters for region:", type, code, year, "found:", found, "not found:", notfound);
    return regionClusters;
  }

  function calc_cluster_strength(a) {
    var rclusters = clustersForRegion(a.region_type_t, a.region_code_t, a.year_t),
      total = 0, strong_total = 0, cluster_totals = [];
    a.str_clusters_txt = [];
    a.str_cluster_codes_txt = [];
    a.str_cluster_keys_txt =[];
//    console.log(rclusters.length);
    rclusters.forEach(function(c) {
      if (c && c.traded_b && !c.subcluster_b) {
        total += c.emp_tl;
        if (!cluster_totals[c.cluster_code_t]) {
          cluster_totals[c.cluster_code_t] =0
        }
        cluster_totals[c.cluster_code_t] += c.emp_tl
        if (c.strong_b) {
          strong_total += c.emp_tl;
          a.str_cluster_codes_txt.push(c.cluster_code_t);
          a.str_cluster_keys_txt.push(c.key_t);
          a.str_clusters_txt.push(c.cluster_name_t);
        }
      }
    });
    a.str_emp_per_tf = strong_total/total;
    a.str_emp_tl = strong_total;
    Object.keys(cluster_totals).forEach(function(k) {
      a['cluster_'+k+'_emp_tl'] = cluster_totals[k];
    });
  }

  function calc_poverty(row) {
    if (row.persons_in_poverty_tf && row.total_population_tf) {
      row.poverty_rate_tf = row.persons_in_poverty_tf / row.total_population_tf;
    }
  }

  function calc_advanced_science_workers(a) {
    if (a.total_population_tf && a.total_employed_science_engineering_doctoral_holders_tf) {
      a.advanced_scientific_workers_tf = a.total_employed_science_engineering_doctoral_holders_tf/a.total_population_tf
    }
  }

  function calc_venture_capital(row) {
    if (row.venture_capital_over_time_tf && row.gross_domestic_product_tf) {
      row.venture_capital_per_gdp_tf  = row.venture_capital_over_time_tf/(row.gross_domestic_product_tf / 10000);
    }
  }

  function _calc_per(row, key, total, keys) {
    var per_key = key.substring(0, key.lastIndexOf('_')) + '_per_tf';
    var val = row[key] || 0;
    if (keys && Array.isArray(keys)) {
        keys.forEach(function(k) {
            if (row[k]) val += +row[k];
        });
    }
    if (val) {
      row[per_key] = +val / +total;
    }
  }

  function calc_demographic_percentages(row) {

    if (row.total_population_tf) {
      _calc_per(row, 'population_by_age_ages_0_to_4_preschool_tf', row.total_population_tf);
      _calc_per(row, 'population_by_age_ages_5_to_17_school_age_tf', row.total_population_tf);
      _calc_per(row, 'population_by_age_ages_18_to_24_college_age_tf', row.total_population_tf);
      _calc_per(row, 'population_by_age_ages_25_to_44_young_adult_tf', row.total_population_tf);
      _calc_per(row, 'population_by_age_45_to_64_older_adult_tf', row.total_population_tf);
      _calc_per(row, 'population_by_age_age_65_and_older_older_tf', row.total_population_tf);
    }
  }

  function calc_education_percentages(row) {
    if(row.educational_attainment_25_years_and_over_total_population_25_years_and_over_tf) {

      var total_pop_over_25 = row.educational_attainment_25_years_and_over_total_population_25_years_and_over_tf;

      _calc_per(row, 'educational_attainment_25_years_and_over_high_school_graduate_tf', total_pop_over_25, ['educational_attainment_25_years_and_over_some_college_or_associates_tf', 'educational_attainment_25_years_and_over_bachelors_tf','educational_attainment_25_years_and_over_masters_professional_ph_d_tf']);
      _calc_per(row, 'educational_attainment_25_years_and_over_some_college_or_associates_tf', total_pop_over_25, ['educational_attainment_25_years_and_over_bachelors_tf','educational_attainment_25_years_and_over_masters_professional_ph_d_tf']);
      _calc_per(row, 'educational_attainment_25_years_and_over_bachelors_tf', total_pop_over_25, ['educational_attainment_25_years_and_over_masters_professional_ph_d_tf']);
    }
  }

  function calc_migration_percentages(row) {
    if (row.total_population_tf) {
      _calc_per(row, 'net_domestic_migration_tf', row.total_population_tf);
      _calc_per(row, 'net_international_migration_tf', row.total_population_tf);
    }
  }

  function calc_agricultural_output(row) {
    if (+row.census_of_ag_total_sales_tf && +row.gross_domestic_product_tf) {
      row.agricultural_output_gdp_tf = +row.census_of_ag_total_sales_tf * 1000 / +row.gross_domestic_product_tf;
    }
  }

  function calc_government_employment(row) {
    if (! +row.gov_employment_local_services_tf) {
      row.gov_employment_local_services_tf = 0;
    }
    row.gov_employment_local_services_tf += +row.total_govt_emp_elementary_and_secondary___instruction_tf || 0; // 282
    row.gov_employment_local_services_tf += +row.total_govt_emp_firefighters_tf || 0; // 289
    row.gov_employment_local_services_tf += +row.total_govt_emp_judical__legal_tf || 0; // 290
    row.gov_employment_local_services_tf += +row.total_govt_emp_streets__highways_tf || 0; // 294
    row.gov_employment_local_services_tf += +row.total_govt_emp_housing__community_development_local_tf || 0; // 295
    row.gov_employment_local_services_tf += +row.total_govt_emp_local_libraries_tf || 0; // 296
    row.gov_employment_local_services_tf += +row.total_govt_emp_parks__recreation_tf || 0; // 299
    row.gov_employment_local_services_tf += +row.total_govt_emp_sewerage_tf || 0; // 301
    row.gov_employment_local_services_tf += +row.total_govt_emp_solid_waste_management_tf || 0; // 302
    row.gov_employment_local_services_tf += +row.total_govt_emp_water_supply_tf || 0; // 306
    row.gov_employment_local_services_tf += +row.total_govt_emp_electric_power_tf || 0; // 307
    row.gov_employment_local_services_tf += +row.total_govt_emp_gas_supply_tf || 0; // 308
    row.gov_employment_local_services_tf += +row.total_govt_emp_transit_tf || 0; // 309
    row.gov_employment_local_services_tf += +row.total_govt_emp_elementary_and_secondary___other_total_tf || 0; // 310
    row.gov_employment_local_services_tf += +row.total_govt_emp_fire___other_tf || 0; // 311
    row.gov_employment_local_services_tf += +row.total_govt_emp_police_other_tf || 0; // 312

    if (! +row.gov_employment_federal_services_tf) {
      row.gov_employment_federal_services_tf = 0;
    }
    row.gov_employment_federal_services_tf += +row.total_govt_emp_airports_tf || 0; // 278
    row.gov_employment_federal_services_tf += +row.total_govt_emp_space_research__technology_federal_tf || 0; // 279
    row.gov_employment_federal_services_tf += +row.total_govt_emp_correction_tf || 0; // 280
    row.gov_employment_federal_services_tf += +row.total_govt_emp_national_defense_and_international_relations_fede_tf || 0; // 281
    row.gov_employment_federal_services_tf += +row.total_govt_emp_postal_service_federal_tf || 0; // 283
    row.gov_employment_federal_services_tf += +row.total_govt_emp_social_insurance_administration_state_tf || 0; // 287
    row.gov_employment_federal_services_tf += +row.total_govt_emp_financial_administration_tf || 0; // 288
    row.gov_employment_federal_services_tf += +row.total_govt_emp_other_government_administration_tf || 0; // 291
    row.gov_employment_federal_services_tf += +row.total_govt_emp_natural_resources_tf || 0; // 297
    row.gov_employment_federal_services_tf += +row.total_govt_emp_parks__recreation_tf || 0; // 298
    row.gov_employment_federal_services_tf += +row.total_govt_emp_welfare_tf || 0; // 300
    row.gov_employment_federal_services_tf += +row.total_govt_emp_water_transport__terminals_tf || 0; // 303
    
    if (! +row.gov_employment_higher_education_tf) {
      row.gov_employment_higher_education_tf = 0;
    }
    row.gov_employment_higher_education_tf += +row.total_govt_emp_higher_education___other_tf || 0; // 284
    row.gov_employment_higher_education_tf += +row.total_govt_emp_higher_education___instructional_tf || 0; // 285
    row.gov_employment_higher_education_tf += +row.total_govt_emp_other_education_state_tf || 0; // 286

    if (row.region_type_t == 'state') {
      if (! +row.gov_employment_health_hospitals_tf) {
        row.gov_employment_health_hospitals_tf = 0;
      }
      row.gov_employment_health_hospitals_tf += +row.total_govt_emp_health_tf || 0; // 292
      row.gov_employment_health_hospitals_tf += +row.total_govt_emp_hospitals_tf || 0; // 293

      if ( isNaN(+row.military_payroll_tf)) {
        row.military_payroll_tf = 0;
      }
      row.military_payroll_tf += +row.military_personnel_expenditures__total_payroll_tf || 0; // 168
      row.military_payroll_tf += +row.military_personnel_expenditures__active_duty_payroll_tf || 0; // 169
      row.military_payroll_tf += +row.military_personnel_expenditures__contract_awards_tf || 0; // 170
      row.military_payroll_tf += +row.military_personnel_expenditures__grants_tf || 0; // 171
      row.military_payroll_per_capita_tf = row.total_population_tf ? row.military_payroll_tf * 1000 / row.total_population_tf : 0;

    }
  }

  return {
    getId: function (row) {
      return row.id;
    },
    transform: function (row, i, id) {
      calc_prosperity(row);
      calc_labor_mobilization(row);
      calc_unemployment(row);
      calc_poverty(row);
      calc_laborforce_productivity(row);
      calc_innovation(row);
      calc_exports(row);
      calc_scientific_degrees(row);
      calc_rd(row);
      calc_federal_rd(row);
      calc_unionization(row);
      calc_taxes(row);
      calc_corp_taxes(row);
      calc_manufacturing_intensity(row);
      calc_pop_density(row);
      calc_firm_size(row);
      calc_advanced_science_workers(row);
      calc_venture_capital(row);
      calc_cluster_strength(row);
      calc_demographic_percentages(row);
      calc_education_percentages(row);
      calc_migration_percentages(row);
      calc_agricultural_output(row);
      calc_government_employment(row);
      return row;
    }
  }
}
module.exports = create_importer;

