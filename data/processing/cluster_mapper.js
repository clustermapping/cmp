function create_importer() {
    return {
        getId: function (row) {
            return row.cluster_code;
        },
        transform: function (row, i, id) {
            return {
                id: id,
                type_t: 'clusterData',
                name_t: row.cluster_name,
                short_name_t: row.short_name,
                short_name2_t: row.short_name2,
                icon_t: row.icon,
                cluster_code_t: row.cluster_code,
                sub_code_t: row.sub_code,
                sub_name_t: row.sub_name,
                traded_b: row.traded_local === 'Traded',
                naics_label_t: row.label,
                naics_2017_t: row.NAICS2017 || row.naics2017,
                naics_2012_t: row.NAICS2012 || row.naics2012,
                naics_2007_t: row.NAICS2007 || row.naics2007,
                naics_2002_t: row.NAICS2002 || row.naics2002,
                naics_1997_t: row.NAICS1997 || row.naics1997
            }
        }
    }
}

module.exports = create_importer;
