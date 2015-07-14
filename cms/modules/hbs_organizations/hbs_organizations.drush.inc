<?php

/**
 * Implements hook_drush_command().
 */
function hbs_organizations_drush_command() {
  $items = array();

  $items['hbs_swaplatlong'] = array(
    'description' => "Swaps the lat/long data in the Location field for Organization nodes",
    'examples' => array(
      'drush hbs_swaplatlong' => 'Swap lat/long field values',
    ),
    'aliases' => array('hbslatlng', 'hbslatlong'),
    'bootstrap' => DRUSH_BOOTSTRAP_DRUSH, // No bootstrap at all.
  );

  return $items;
}

/**
 * Drush command callback for the 'hbs_import' command.
 */
function drush_hbs_organizations_hbs_swaplatlong() {
  drush_print ("Beginning run...");

  // $known_nids = _get_known_bad_nids();
  $bad_nids = array();

  $or = db_or()
        ->condition('l.field_location_lat', -90, '<')
        ->condition('l.field_location_lat',  90, '>');

  $query = db_select('field_data_field_location', 'l')
           ->fields('l')
           // ->condition($or);
           ->condition('l.field_location_lat', 0 , '<');

  $result = $query->execute();

  while ($record = $result->fetchAssoc()) {
    $bad_nids[$record['entity_id']] = $record['entity_id'];

    $real_lat = $record['field_location_lng'];
    $real_lng = $record['field_location_lat'];
    
    $record['field_location_lat'] = $real_lat;
    $record['field_location_lng'] = $real_lng;

    $lat_rad = deg2rad($record['field_location_lat']);
    $record['field_location_lat_sin'] = sin($lat_rad);
    $record['field_location_lat_cos'] = cos($lat_rad);
    $record['field_location_lng_rad'] = deg2rad($record['field_location_lng']);

    $record_udpated = db_update('field_data_field_location')
      ->fields($record)
      ->condition('entity_id', $record['entity_id'])
      ->execute();

    drush_print("Updating record: " . $record['entity_id']);
  }

  drush_print("Flushing caches...");
  drupal_flush_all_caches();

  drush_print("Updating affected nodes...");
  foreach (node_load_multiple($bad_nids) as $nid => $node) {
    node_save($node);
    drush_print('Saving node: ' . $nid . ' (' . $node->title . ')');
  }
  
}



function _get_known_bad_nids() {
  $known_nids = array(1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420, 1421, 1422, 1423, 1424, 1425, 1426, 1427, 1428, 1429, 1430, 1431, 1432, 1436, 1437, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1457, 1458, 1459, 1460, 1461, 1462, 1463, 1464, 1465, 1466, 1467, 1468, 1469, 1470, 1471, 1472, 1473, 1474, 1475, 1476, 1477, 1478, 1479, 1480, 1481, 1482, 1483, 1484, 1485, 1486, 1487, 1488, 1489, 1491, 1493, 1494, 1495, 1496, 1497, 1498, 1499, 1500, 1501, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1512, 1513, 1514, 1515, 1516, 1517, 1518, 1519, 1520, 1521, 1522, 1523, 1524, 1525, 1526, 1527, 1528, 1529, 1530, 1531, 1532, 1533, 1534, 1535, 1536, 1537, 1538, 1539, 1540, 1541, 1542, 1543, 1544, 1545, 1546, 1547, 1548, 1549, 341, 463, 465, 473, 492, 501, 508, 511, 530, 544, 548, 577, 584, 633, 636, 927, 938, 1002, 1003, 1047, 1076, 1077, 1078, 1079, 1080, 1081, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1093, 1094, 1095, 1096, 1097, 1098, 1099, 1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128, 1129, 1130, 1131, 1132, 1133, 1134, 1135, 1137, 1138, 1139, 1140, 1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169, 1170, 1171, 1172, 1173, 1174, 1176, 1177, 1178, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1188, 1189, 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199, 1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1220, 1221, 1222, 1223, 1224, 1225, 1226, 1227, 1228, 1229, 1230, 1231, 1232, 1233, 1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241, 1242, 1243, 1244, 1245, 1246, 1247, 1248, 1249, 1250, 1251, 1252, 1253, 1254, 1255, 1256, 1257, 1258, 1259, 1260, 1261, 1262, 1263, 1264, 1265, 1266, 1267, 1268, 1269, 1270, 1271, 1272, 1273, 1277, 1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289, 1290, 1291, 1298, 1299, 1300, 1301, 1302, 1303, 1304, 1305, 1306, 1307, 1308, 1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1332, 1334, 1335, 1336, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344, 1345, 1346, 1347, 1348, 1349, 1350, 1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370, 1371, 1372, 1373, 1374, 1375, 1376, 1377, 1378, 1379, 1380, 1381, 1382, 1383, 1384, 1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396, 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408);
  return $known_nids;
}