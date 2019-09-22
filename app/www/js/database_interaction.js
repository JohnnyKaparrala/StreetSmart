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

var where_conditions = [];

var result_set_eq;

//var window_min_length = Math.min(screen.height, screen.width)/100; //TODO Use phone's dpi
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
      map_marker_with_result_set(occurrences_within_view);
      break;
    case HEATMAP_STATE:
      map_state = HEATMAP_STATE;
      map_heatmap_with_result_set(occurrences_within_view);
      break;
  }
}

function map_heatmap_with_result_set (result_set) {
  var data = [];

  for (var i = 0; i < result_set.rows.length; i++) {
    data.push([result_set.rows.item(i).LATITUDE, result_set.rows.item(i).LONGITUDE, 200.]);
  }

  /*if (marker_cluster != null) {
    marker_cluster.remove();
    marker_cluster = null;
  }*/

  map_global.addHeatmap({
    data: data,
    radius: 20,
    opacity: 1
  });
}

function map_marker_with_result_set (result_set) {
  function substitute_period(period) {
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

  function convert_date_iso_format_to_brazilian_format(date) {
    var date_parts = date.split('-');

    return date_parts[2] + '/' + date_parts[1] + '/' + date_parts[0];
  }
  
  for (var i = 0; i < markers.length; i++) {//remove todas as ocorrencias q n estao na visao
    var position = markers[i].getPosition();
    if (position.lat < global_minLat || position.lat > global_maxLat || position.lng < global_minLng || position.lng > global_maxLng) {
      markers_id.delete(markers[i].get("id"));

      marker_cluster._removeMarkerById(markers[i].getId());
      markers.splice(i, 1);
      i = i-1;
    }
  }

  //console.log(markers);
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

  //map_global.clear();

  if (marker_cluster == null)
  {
    marker_cluster = map_global.addMarkerCluster({
      maxZoomLevel: 17.5,
      boundsDraw: false,
      markers: [],
      icons: [
          {min: 2, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions}//,
          //{min: 11, max: 31, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions},
          //{min: 31, max: 91, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions},
          //{min: 91, max: 271, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png",anchor: markers_icon_anchor, label:labelOptions},
          //{min: 271, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png",anchor: markers_icon_anchor, label:labelOptions}//,
          //{min: 91, url: "./icons/furto_celular.png",anchor: {x: 32,y: 32}}
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
          //marker.setTitle(resultSet.rows.item(0).RUBRIC);
          var marker_description = '\n' + "Horário: " + substitute_period(resultSet.rows.item(0).PERIOD) +
          '\n' + "Data: " + convert_date_iso_format_to_brazilian_format(resultSet.rows.item(0).DATE);
  
          if (resultSet.rows.item(0).IS_FLAGRANT !== undefined) {
            marker_description += '\n' + (resultSet.rows.item(0).IS_FLAGRANT ? "É flagrante" : "Não é flagrante");
          }
          marker.setSnippet(marker_description);
          marker.showInfoWindow();

          marker.on(plugin.google.maps.event.INFO_CLICK, function(/*marker*/) {
            get_all_details(marker_id);
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

      var query = "INSERT INTO occurrences (BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, IS_FLAGRANT, ADDRESS_STREET, ADDRESS_NUMBER, ADDRESS_DISTRICT, ADDRESS_CITY, ADDRESS_STATE, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, RUBRIC, FATAL_VICTIM, PERSON_SEX, PERSON_AGE, PERSON_SKIN_COLOR, LINKED_NATURE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

      var occurrence_array = [
        occurrence.BO_YEAR, occurrence.BO_NUMBER, 
        occurrence.BO_BEGIN_TIME, occurrence.BO_EMISSION_TIME, 
        occurrence.DATE, occurrence.PERIOD,
        occurrence.IS_FLAGRANT, 
        occurrence.ADDRESS_STREET, occurrence.ADDRESS_NUMBER, 
        occurrence.ADDRESS_DISTRICT, occurrence.ADDRESS_CITY, 
        occurrence.ADDRESS_STATE, occurrence.LATITUDE, 
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

function get_all_details (marker_id) {
  db.transaction(function (tx) {
    var query = "SELECT BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, IS_FLAGRANT, ADDRESS_STREET, ADDRESS_NUMBER, ADDRESS_DISTRICT, ADDRESS_CITY, ADDRESS_STATE, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, RUBRIC, FATAL_VICTIM, PERSON_SEX, PERSON_AGE, PERSON_SKIN_COLOR, LINKED_NATURE FROM occurrences WHERE occurrences.ID= (?) ";

    tx.executeSql(query, [marker_id], function (tx, resultSet) {
      var rs = resultSet.rows.item(0);
      console.log((rs.BO_YEAR=="")?"Não fornecido":rs.BO_YEAR);
      $("#mod_ano").text((rs.BO_YEAR=="")?"Não fornecido":rs.BO_YEAR);
      $("#mod_numero").text((rs.BO_NUMBER=="")?"Não fornecido":rs.BO_NUMBER);
      $("#mod_bo_iniciado").text((rs.BO_BEGIN_TIME=="")?"Não fornecido":rs.BO_BEGIN_TIME);
      $("#mod_bo_emitido").text((rs.BO_EMISSION_TIME=="")?"Não fornecido":rs.BO_EMISSION_TIME);
      $("#mod_data").text((rs.DATE=="")?"Não fornecido":rs.DATE);
      $("#mod_periodo").text((rs.PERIOD=="")?"Não fornecido":rs.PERIOD);
      $("#mod_flagrante").text((rs.IS_FLAGRANT=="")?"Não fornecido":rs.IS_FLAGRANT);
      $("#mod_rua").text((rs.ADDRESS_STREET=="")?"Não fornecido":rs.ADDRESS_STREET);
      $("#mod_numero").text((rs.ADDRESS_NUMBER=="")?"Não fornecido":rs.ADDRESS_NUMBER);
      $("#mod_cidade").text((rs.ADDRESS_DISTRICT=="")?"Não fornecido":rs.ADDRESS_DISTRICT);
      $("#mod_bairro").text((rs.ADDRESS_CITY=="")?"Não fornecido":rs.ADDRESS_CITY);
      $("#mod_estado").text((rs.ADDRESS_STATE=="")?"Não fornecido":rs.ADDRESS_STATE);
      $("#mod_latitude").text((rs.LATITUDE=="")?"Não fornecido":rs.LATITUDE);
      $("#mod_longitude").text((rs.LONGITUDE=="")?"Não fornecido":rs.LONGITUDE);
      $("#mod_descricao_local").text((rs.PLACE_DESCRIPTION=="")?"Não fornecido":rs.PLACE_DESCRIPTION);
      $("#mod_nome_delegacia").text((rs.POLICE_STATION_NAME=="")?"Não fornecido":rs.POLICE_STATION_NAME);
      $("#mod_delegacia_circunscricao").text((rs.POLICE_STATION_CIRCUMSCRIPTION=="")?"Não fornecido":rs.POLICE_STATION_CIRCUMSCRIPTION);
      $("#mod_rubrica").text((rs.RUBRIC=="")?"Não fornecido":rs.RUBRIC);
      $("#mod_vitima_fatal").text((rs.FATAL_VICTIM=="")?"Não fornecido":rs.FATAL_VICTIM);
      $("#mod_sexo").text((rs.PERSON_SEX=="")?"Não fornecido":rs.PERSON_SEX);
      $("#mod_idade").text((rs.PERSON_AGE=="")?"Não fornecido":rs.PERSON_AGE);
      $("#mod_cor_cutis").text((rs.PERSON_SKIN_COLOR=="")?"Não fornecido":rs.PERSON_SKIN_COLOR);
      $("#mod_natureza_vinculada").text((rs.LINKED_NATURE=="")?"Não fornecido":rs.LINKED_NATURE);
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

function getOccurrencesWithinRectangle(maxLng, minLng, maxLat, minLat) { /* eslint-disable-line no-unused-vars */
  global_maxLng = maxLng;
  global_minLng = minLng;
  global_maxLat = maxLat;
  global_minLat = minLat;
  db.transaction(function (tx) {
      var query = "SELECT occurrences.ID, occurrences.LATITUDE, occurrences.LONGITUDE, occurrences.RUBRIC FROM occurrences, occurrences_index WHERE occurrences.ID=occurrences_index.ID ";
      
      for (var i = 0; i < where_conditions.length; i++) {
        query += "AND " + where_conditions[i] + " ";
      }

      query += "AND occurrences_index.maxLng<=(?) AND occurrences_index.minLng>=(?) AND occurrences_index.maxLat<=(?) AND occurrences_index.minLat>=(?);";

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

function convert_date_format_to_sqlite(date) {
  // date: DD/MM/YYYY HH:MM
  var return_string = "";
  var parts = date.split(" ");
  var first_half = parts[0].split("/");

  var year = first_half[2];
  var month = first_half[1];
  var day = first_half[0];

  return_string = year + "-" + month + "-" + day;

  if (parts.length == 2) {
    /*var second_half = parts[1].split(":");

    var hours = second_half[0];
    var minutes = second_half[1];*/

    return_string = return_string + " " + parts[1]; // hours + ":" + minutes
  }

  return return_string;
}

function insert_json_in_db (dir_json) {
  function convert_period(period) {
    period = period.toUpperCase();

    switch (period) {
      case "PELA MANHÃ":
        return 'M';
      case "DE MADRUGADA":
        return 'D';
      case "A TARDE":
        return 'N';
      case "A NOITE":
        return 'E';
      case "EM HORA INCERTA":
        return 'U';
    }
  }

  function convert_yes_no_to_bool(yes_no) {
    yes_no = yes_no[0].toUpperCase();

    return yes_no == "S";
  }

  function convert_person_sex(sex) {
    switch (sex[0].toUpperCase()) {
      case "M":
        return "M";
      case "F":
        return "F";
      default:
        return "U";
    }
  }

  function convert_skin_color(skin_color) {
    skin_color = skin_color.toLowerCase().replace("ã", "a");

    switch (skin_color) {
      case "branca":
      case "branco":
        return 'W';
      case "negra":
      case "negro":
      case "preta":
      case "preto":
        return 'B';
      case "parda":
      case "pardo":
        return 'P';
      case "outros":
      case "outro":
        return 'O';
      case "nao informada":
      case "nao informado":
        return 'N';  
    }
  }

  $.getJSON( dir_json, function( data ) {
    $.each( data, function(key,value) {
      if (value.LATITUDE != "") {
        var occurrence = {
          BO_YEAR: (value.ANO_BO != "" ? parseInt(value.ANO_BO) : null),
          BO_NUMBER: (value.NUM_BO != "" ? parseInt(value.NUM_BO) : null),
          BO_BEGIN_TIME: (value.BO_INICIADO != "" ? convert_date_format_to_sqlite(value.BO_INICIADO) : null),
          BO_EMISSION_TIME: (value.BO_EMITIDO != "" ? convert_date_format_to_sqlite(value.BO_EMITIDO) : null),
          DATE: (value.DATAOCORRENCIA != "" ? convert_date_format_to_sqlite(value.DATAOCORRENCIA) : null),
          PERIOD: (value.PERIDOOCORRENCIA != "" ? convert_period(value.PERIDOOCORRENCIA) : null),
          IS_FLAGRANT: (value.FLAGRANTE != "" ? convert_yes_no_to_bool(value.FLAGRANTE) : null),
          ADDRESS_STREET: (value.LOGRADOURO != "" ? value.LOGRADOURO : null),
          ADDRESS_NUMBER: (value.NUMERO != "" ? parseInt(value.NUMERO) : null),
          ADDRESS_DISTRICT: (value.BAIRRO != "" ? value.BAIRRO : null),
          ADDRESS_CITY: (value.CIDADE != "" ? value.CIDADE : null),
          ADDRESS_STATE: (value.UF != "" ? value.UF : null),
          LATITUDE: (value.LATITUDE != "" ? parseFloat(value.LATITUDE.replace(",",".")) : null),
          LONGITUDE: (value.LONGITUDE != "" ? parseFloat(value.LONGITUDE.replace(",",".")) : null),
          PLACE_DESCRIPTION: (value.DESCRICAOLOCAL != "" ? value.DESCRICAOLOCAL : null),
          POLICE_STATION_NAME: (value.DELEGACIA_NOME != "" ? value.DELEGACIA_NOME : null),
          POLICE_STATION_CIRCUMSCRIPTION: (value.DELEGACIA_CIRCUNSCRICAO != "" ? value.DELEGACIA_CIRCUNSCRICAO : null),
          RUBRIC: (value.RUBRICA != "" ? value.RUBRICA : null),
          FATAL_VICTIM: (value.VITIMAFATAL != "" ? convert_yes_no_to_bool(value.VITIMAFATAL) : null),
          PERSON_SEX: (value.SEXO != "" ? convert_person_sex(value.SEXO) : null),
          PERSON_AGE: (value.IDADE != "" ? parseInt(value.IDADE) : null),
          PERSON_SKIN_COLOR: (value.CORCUTIS != "" ? convert_skin_color(value.CORCUTIS) : null),
          LINKED_NATURE: (value.NATUREZAVINCULADA != "" ? value.NATUREZAVINCULADA : null)
        }

        addOccurrence(occurrence);
      } else {
        console.log("Sem coordenadas");
      }
    });
  });
}


function execute_query(query) {
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