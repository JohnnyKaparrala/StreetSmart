/* global map_global */

var db;
var MARKERS_STATE = 0;
var HEATMAP_STATE = 1;

var map_state = MARKERS_STATE;

var occurrences_within_view = [];
var global_maxLng;
var global_minLng;
var global_maxLat;
var global_minLat;
var markers = [];
var markers_id = new Set();
var marker_cluster;
var heatmap_global;

var result_set_eq;

//TODO Maybe use phone's dpi
var markers_icon_size = 10.833333333333334 * (Math.min(screen.height, screen.width)/100);
var markers_icon_anchor = {x: 23,y: 46};

document.addEventListener("deviceready", function() {
  if (cordova.platformId == 'android') {
    StatusBar.overlaysWebView(true);
    StatusBar.backgroundColorByHexString('#33000000');
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default',
      androidDatabaseProvider: 'system',
      createFromLocation: 1
    }, function() {},
    function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
    });
  }
  else {
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default',
      createFromLocation: 1
    },
    function() {},
    function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
    });
  }
});

function getOccurrencesWithinView(result_set) {
  occurrences_within_view = result_set;

  switch (map_state) {
    case MARKERS_STATE:
      map_state = MARKERS_STATE;
      mapMarkerWithResultSet(occurrences_within_view);
      break;
    case HEATMAP_STATE:
      map_state = HEATMAP_STATE;
      mapHeatmapWithResultSet(occurrences_within_view);
      break;
  }
}

function mapHeatmapWithResultSet(result_set) {
  var data = [];

  for (var i = 0; i < result_set.rows.length; i++) {
    data.push([result_set.rows.item(i).LATITUDE, result_set.rows.item(i).LONGITUDE, 200.]);
  }

  if (heatmap_global == null) {
    heatmap_global = map_global.addHeatmap({
      data: data,
      radius: 20,
      opacity: 1
    });
  }
  else {
    heatmap_global.setData(data);
  }
}

function convertYesNoFromDb(yes_no) {
  if (yes_no == 'Y')
    return 'Sim'
  else
    return 'Não'
}

function convertDateFromDbToBrazilianFormat(date) {
  var date_time_parts = date.split(' ');

  var date_parts = date_time_parts[0].split('-');

  var result = date_parts[2] + '/' + date_parts[1] + '/' + date_parts[0];

  if (date_time_parts.length > 1)
    result += ' ' + date_time_parts[1];

  return result;
}

function convertPeriodFromDb(period) {
  switch (period) {
    case 'M':
      return "De manhã";
    case 'D':
      return "De madrugada";
    case 'N':
      return 'À tarde';
    case 'E':
      return 'À noite';
    case 'U':
      return 'Em hora incerta';
  }
}

function convertSkinColorFromDb(period) {
  switch (period) {
    case 'W':
      return "Branca";
    case 'B':
      return "Preta";
    case 'P':
      return 'Parda';
    case 'R':
      return 'Vermelha';
    case 'Y':
      return 'Amarela';
  }
}

function mapMarkerWithResultSet (result_set) {
  // Removes all occurrences that aren't within vision
  for (var i = 0; i < markers.length; i++) {
    var position = markers[i].getPosition();
    if (position.lat < global_minLat || position.lat > global_maxLat || position.lng < global_minLng || position.lng > global_maxLng) {
      markers_id.delete(markers[i].get("id"));

      marker_cluster._removeMarkerById(markers[i].getId());
      markers.splice(i, 1);
      i = i-1;
    }
  }

  var markers_to_be_added = [];
  for (var i = 0; i < result_set.rows.length; i++) { /* eslint-disable-line no-redeclare */
    if (markers_id.has(result_set.rows.item(i).ID)) {
      continue;
    }

    var marker_to_be_added = {
      id: result_set.rows.item(i).ID,
      position: {lat:result_set.rows.item(i).LATITUDE, lng:result_set.rows.item(i).LONGITUDE},
      title: result_set.rows.item(i).RUBRIC,
      snippet: "...",
      icon: {
        url: "./icons/arma.png", // TODO Make images to each type
        size: {
          width: markers_icon_size,
          height: markers_icon_size
        },
        anchor: markers_icon_anchor
      }
    };
    markers_to_be_added.push(marker_to_be_added);

    markers_id.add(result_set.rows.item(i).ID);
  }

  var labelOptions = {
    bold: true,
    fontSize: 15,
    color: "white"
  };

  if (marker_cluster == null)
  {
    marker_cluster = map_global.addMarkerCluster({
      maxZoomLevel: 17.5,
      boundsDraw: false,
      markers: [],
      icons: [
          {min: 2, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions}
      ]
    });
    
    marker_cluster.on(plugin.google.maps.event.MARKER_CLICK, function (position, marker) {
      if (marker.getSnippet() !== "...")
        return;
      
      db.transaction(function (tx) {
        var marker_id = marker.get("id");
        var query = "SELECT occurrences.PERIOD, occurrences.DATE, occurrences.LINKED_NATURE FROM occurrences WHERE occurrences.ID=" + marker_id;
  
        console.log("query: " + query);
        tx.executeSql(query, [], function (tx, resultSet) {
          var marker_description = '\n' + "Horário: " + convertPeriodFromDb(resultSet.rows.item(0).PERIOD) +
          '\n' + "Data: " + convertDateFromDbToBrazilianFormat(resultSet.rows.item(0).DATE);
  
          if (resultSet.rows.item(0).IS_FLAGRANT !== undefined) {
            marker_description += '\n' + (resultSet.rows.item(0).IS_FLAGRANT ? "É flagrante" : "Não é flagrante");
          }
          marker.setSnippet(marker_description);
          marker.showInfoWindow();

          marker.on(plugin.google.maps.event.INFO_CLICK, function(/*marker*/) {
            populateAndOpenOccurrenceDetailsModal(marker_id);
          });
        },
        function (tx, error) {
            console.log('SELECT error: ' + error.message);
        });
      }, function (error) {
        console.log('transaction error: ' + error.message);
      }, function () {
        console.log('transaction ok');
      });
      
    });
  }
  
  markers = markers.concat(marker_cluster.addMarkers(markers_to_be_added));
}

function addOccurrence(occurrence) {
  db.transaction(function (tx) {

      var query = "INSERT INTO occurrences (BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, IS_FLAGRANT, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, RUBRIC, FATAL_VICTIM, PERSON_SEX, PERSON_AGE, PERSON_SKIN_COLOR, LINKED_NATURE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

      var occurrence_array = [
        occurrence.BO_YEAR, occurrence.BO_NUMBER, 
        occurrence.BO_BEGIN_TIME, occurrence.BO_EMISSION_TIME, 
        occurrence.DATE, occurrence.PERIOD,
        occurrence.IS_FLAGRANT, occurrence.LATITUDE, 
        occurrence.LONGITUDE, occurrence.PLACE_DESCRIPTION, 
        occurrence.POLICE_STATION_NAME, occurrence.POLICE_STATION_CIRCUMSCRIPTION,
        occurrence.RUBRIC, 
        occurrence.FATAL_VICTIM, occurrence.PERSON_SEX, 
        occurrence.PERSON_AGE, occurrence.PERSON_SKIN_COLOR, 
        occurrence.LINKED_NATURE
      ];

      tx.executeSql(query, occurrence_array, function(tx, res) {
          console.log("insertId: " + res.insertId);
          console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
      },
      function(tx, error) {
          console.log('INSERT error: ' + error.message);
      });

      query = "INSERT INTO occurrences_index (minLng, maxLng, minLat, maxLat) VALUES (?,?,?,?);";
      
      occurrence_array = [
        occurrence.LONGITUDE, occurrence.LONGITUDE, occurrence.LATITUDE, occurrence.LATITUDE
      ];

      tx.executeSql(query, occurrence_array, function(tx, res) {
          console.log("insertId: " + res.insertId);
          console.log("rowsAffected: " + res.rowsAffected + " -- should be 4");
      },
      function(tx, error) {
          console.log('INSERT error: ' + error.message);
      });
  }, function(error) {
      console.log('transaction error: ' + error.message);
  }, function() {
      console.log('transaction ok');
  });
}

function populateAndOpenOccurrenceDetailsModal(marker_id) {
  db.transaction(function (tx) {
    var query = "SELECT BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, IS_FLAGRANT, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, RUBRIC, FATAL_VICTIM, PERSON_SEX, PERSON_AGE, PERSON_SKIN_COLOR, LINKED_NATURE FROM occurrences WHERE occurrences.ID= (?) ";

    tx.executeSql(query, [marker_id], function (tx, resultSet) {
      var rs = resultSet.rows.item(0);
      console.log(rs.BO_YEAR);
      $("#mod_ano").text(rs.BO_YEAR);
      $("#mod_numero").text(rs.BO_NUMBER);
      $("#mod_bo_iniciado").text((rs.BO_BEGIN_TIME== null)?"Não fornecido":convertDateFromDbToBrazilianFormat(rs.BO_BEGIN_TIME));
      $("#mod_bo_emitido").text((rs.BO_EMISSION_TIME== null)?"Não fornecido":convertDateFromDbToBrazilianFormat(rs.BO_EMISSION_TIME));
      $("#mod_data").text((rs.DATE== null)?"Não fornecido":convertDateFromDbToBrazilianFormat(rs.DATE));
      $("#mod_periodo").text((rs.PERIOD== null)?"Não fornecido":convertPeriodFromDb(rs.PERIOD));
      $("#mod_flagrante").text((rs.IS_FLAGRANT== null)?"Não fornecido":convertYesNoFromDb(rs.IS_FLAGRANT));
      /*$("#mod_rua").text((rs.ADDRESS_STREET== null)?"Não fornecido":rs.ADDRESS_STREET);
      $("#mod_numero").text((rs.ADDRESS_NUMBER== null)?"Não fornecido":rs.ADDRESS_NUMBER);
      $("#mod_cidade").text((rs.ADDRESS_DISTRICT== null)?"Não fornecido":rs.ADDRESS_DISTRICT);
      $("#mod_bairro").text((rs.ADDRESS_CITY== null)?"Não fornecido":rs.ADDRESS_CITY);
      $("#mod_estado").text((rs.ADDRESS_STATE== null)?"Não fornecido":rs.ADDRESS_STATE);*/
      $("#mod_latitude").text((rs.LATITUDE== null)?"Não fornecido":rs.LATITUDE);
      $("#mod_longitude").text((rs.LONGITUDE== null)?"Não fornecido":rs.LONGITUDE);
      $("#mod_descricao_local").text((rs.PLACE_DESCRIPTION== null)?"Não fornecido":rs.PLACE_DESCRIPTION);
      $("#mod_nome_delegacia").text(rs.POLICE_STATION_NAME);
      $("#mod_delegacia_circunscricao").text((rs.POLICE_STATION_CIRCUMSCRIPTION== null)?"Não fornecido":rs.POLICE_STATION_CIRCUMSCRIPTION);
      $("#mod_rubrica").text((rs.RUBRIC== null)?"Não fornecido":rs.RUBRIC);

      if (rs.PERSON_SEX == null) {
        $("#mod_vitima_fatal").parent().hide();
        $("#mod_sexo").parent().hide();
        $("#mod_idade").parent().hide();
        $("#mod_cor_cutis").parent().hide();
      }
      else {
        $("#mod_vitima_fatal").text((rs.FATAL_VICTIM== null)?"Não fornecido":convertYesNoFromDb(rs.FATAL_VICTIM));
        $("#mod_sexo").text(rs.PERSON_SEX);
        $("#mod_idade").text(rs.PERSON_AGE);
        $("#mod_cor_cutis").text(convertSkinColorFromDb(rs.PERSON_SKIN_COLOR));
      }
      
      $("#mod_natureza_vinculada").text((rs.LINKED_NATURE==null)?"Não fornecido":rs.LINKED_NATURE);
      $("#ocorrencia_detalhes").modal('open');
    },
    function (tx, error) {
        console.log('SELECT error: ' + error.message);
    });
}, function (error) {
    console.log('transaction error: ' + error.message);
}, function () {
    console.log('transaction ok');
});
}

function getOccurrencesWithinRectangle(maxLng, minLng, maxLat, minLat, query_conditions) { /* eslint-disable-line no-unused-vars */
  global_maxLng = maxLng;
  global_minLng = minLng;
  global_maxLat = maxLat;
  global_minLat = minLat;
  db.transaction(function (tx) {
      var query = "SELECT occurrences.ID, occurrences.LATITUDE, occurrences.LONGITUDE, occurrences.RUBRIC FROM occurrences, occurrences_index WHERE occurrences.ID=occurrences_index.ID AND occurrences_index.maxLng<=(?) AND occurrences_index.minLng>=(?) AND occurrences_index.maxLat<=(?) AND occurrences_index.minLat>=(?) ";
      
      if (query_conditions !== undefined)
      for (var i = 0; i < query_conditions.length; i++) {
        query += "AND " + query_conditions[i] + " ";
      }

      query += ";";

      console.log("query: " + query);
      tx.executeSql(query, [maxLng, minLng, maxLat, minLat], function (tx, resultSet) {
        getOccurrencesWithinView(resultSet);
      },
      function (tx, error) {
          console.log('SELECT error: ' + error.message);
      });
  }, function (error) {
      console.log('transaction error: ' + error.message);
  }, function () {
      console.log('transaction ok');
  });
}

function convertDateToDb(date) {
  // date: DD/MM/YYYY HH:MM
  var return_string = "";
  var parts = date.split(" ");
  var first_half = parts[0].split("/");

  var year = first_half[2];
  var month = first_half[1];
  var day = first_half[0];

  return_string = year + "-" + month + "-" + day;

  if (parts.length == 2) {
    return_string = return_string + " " + parts[1]; // hours + ":" + minutes
  }

  return return_string;
}

function executeQuery(query) {
  db.transaction(function (tx) {
    tx.executeSql(query, [], function(tx, resultSet) {
      result_set_eq = resultSet;
      console.log(resultSet);
    });
}, function (error) {
    console.log('transaction error: ' + error.message);
}, function () {
    console.log('transaction ok');
});
}