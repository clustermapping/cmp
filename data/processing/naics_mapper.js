

function _region_code(row) {
  var uscode = row.uscode|| row.USCODE, fipscty = row.fipscty || row.FIPSCTY, fipstate = row.fipstate || row.FIPSTATE,
    msa = row.msa || row.MSA;
  if (uscode) return uscode;
  if (fipscty && fipstate) return fipstate + fipscty;
  if (fipstate) return fipstate;
  if (msa) return msa;
}

function create_importer(year, type) {
    return {
        getId: function(row) {
            if (row.NAICS) { row.naics = row.NAICS; }
            if (row.naics === '------') row.naics = 'total';
            return 'naics/'
                    + [year, type, _region_code(row), row.naics].join('/');
        },

        filter: function (row) {
          var naics = row.naics || row.NAICS, lfo = row.lfo || row.LFO, fipscty = row.fipscty||row.FIPSCTY, result = true;
          if (fipscty == '999') { result = false }
          else { result = !/[\/\-]/.test(naics)
            && (lfo == '-' || lfo === undefined || lfo == '-0'); }
          return result;
        },

        transform: function(row, i, id) {
            var doc = {
                  id: id,
                  type_t: 'naics',
                  year_t: year,
                  region_type_t: type,
                  region_code_t: _region_code(row),
                  naics_t: row.naics || row.NAICS,
                  fipstate_t: row.fipstate || row.FIPSTATE,
                  fipscity_t: row.fipscty || row.FIPSCTY,
                  empflag_t: row.empflag || row.EMPFLAG,
                  emp_tl: +row.emp || +row.EMP,
                  qp1_tl: +row.qp1 || +row.QP1,
                  ap_tl: +row.ap || +row.AP,
                  est_tl: +row.est || +row.EST
            };
             if (row.empflag) {
               doc.emp_tl = 0;
               doc.ap_tl = 0;
             }
            return doc;
        }
    };
}



module.exports = create_importer;