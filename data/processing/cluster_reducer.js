var cluster = function (persister) {
    var _delegate = function (target, action, def) {
        return function () {
            if (target && target[action]) {
                return target[action].apply(persister, arguments);
            } else {
                return def;
            }
        }
    },
        keyName = function (str) {
            return str.replace(/[\(\),'":;\/\.]/g, '').replace(/[\- ]/g, '_').replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();
        };

    function _processCluster(data) {
        var cluster = persister.get('clusterData/' + data.cluster_code_t);
        if (!cluster) {
            cluster = {
                id: 'clusterData/' + data.cluster_code_t,
                type_t: data.type_t,
                name_t: data.name_t,
                key_t: keyName(data.name_t),
                short_name_t: data.short_name_t,
                short_name2_t: data.short_name2_t,
                icon_t: data.icon_t,
                cluster_code_t: data.cluster_code_t,
                traded_b: data.traded_b,
                subcluster_b: false,
                sub_code_txt: [],
                sub_name_txt: [],
                naics_2017_labels_txt: [],
                naics_2017_codes_txt: [],
                naics_2012_labels_txt: [],
                naics_2012_codes_txt: [],
                naics_2007_labels_txt: [],
                naics_2007_codes_txt: [],
                naics_2002_labels_txt: [],
                naics_2002_codes_txt: [],
                naics_1997_labels_txt: [],
                naics_1997_codes_txt: []
            };
        }

        if (cluster.sub_code_txt.indexOf(data.sub_code_t) == -1) {
            cluster.sub_code_txt.push(data.sub_code_t);
            cluster.sub_name_txt.push(data.sub_name_t);
        }

        if (data.naics_2017_t !== '#N/A') {
            cluster.naics_2017_codes_txt.push(data.naics_2017_t);
            cluster.naics_2017_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2012_t !== '#N/A') {
            cluster.naics_2012_codes_txt.push(data.naics_2012_t);
            cluster.naics_2012_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2007_t !== '#N/A') {
            cluster.naics_2007_codes_txt.push(data.naics_2007_t);
            cluster.naics_2007_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2002_t !== '#N/A') {
            cluster.naics_2002_codes_txt.push(data.naics_2002_t);
            cluster.naics_2002_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_1997_t !== '#N/A') {
            cluster.naics_1997_codes_txt.push(data.naics_1997_t);
            cluster.naics_1997_labels_txt.push(data.naics_label_t);
        }
        persister.persist(cluster);
    }

    function _processSubcluster(data) {
        var id = 'clusterData/' + data.cluster_code_t + '/' + data.sub_code_t,
            subcluster = persister.get(id);
        if (!subcluster) {
            subcluster = {
                id: id,
                type_t: data.type_t,
                name_t: data.name_t,
                key_t: keyName(data.name_t + '_' + data.sub_name_t),
                parent_key_t: keyName(data.name_t),
                short_name_t: data.short_name_t,
                short_name2_t: data.short_name2_t,
                icon_t: data.icon_t,
                cluster_code_t: data.cluster_code_t,
                traded_b: data.traded_b,
                subcluster_b: true,
                sub_code_t: data.sub_code_t,
                sub_name_t: data.sub_name_t,
                naics_2017_labels_txt: [],
                naics_2017_codes_txt: [],
                naics_2012_labels_txt: [],
                naics_2012_codes_txt: [],
                naics_2007_labels_txt: [],
                naics_2007_codes_txt: [],
                naics_2002_labels_txt: [],
                naics_2002_codes_txt: [],
                naics_1997_labels_txt: [],
                naics_1997_codes_txt: []
            };
        }

        if (data.naics_2017_t !== '#N/A') {
            subcluster.naics_2017_codes_txt.push(data.naics_2017_t);
            subcluster.naics_2017_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2012_t !== '#N/A') {
            subcluster.naics_2012_codes_txt.push(data.naics_2012_t);
            subcluster.naics_2012_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2007_t !== '#N/A') {
            subcluster.naics_2007_codes_txt.push(data.naics_2007_t);
            subcluster.naics_2007_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_2002_t !== '#N/A') {
            subcluster.naics_2002_codes_txt.push(data.naics_2002_t);
            subcluster.naics_2002_labels_txt.push(data.naics_label_t);
        }

        if (data.naics_1997_t !== '#N/A') {
            subcluster.naics_1997_codes_txt.push(data.naics_1997_t);
            subcluster.naics_1997_labels_txt.push(data.naics_label_t);
        }
        persister.persist(subcluster);
    }

    return {
        persist: function (data) {
            _processCluster(data);
            _processSubcluster(data);
        },

        end: _delegate(persister, 'end'),
        should_drain: _delegate(persister, 'should_drain'),
        drain: _delegate(persister, 'drain')
    }
};

module.exports = cluster;
