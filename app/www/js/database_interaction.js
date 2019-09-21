var db;

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

const MARKERS_STATE = 0;
const HEATMAP_STATE = 1;

var occurrences_jsons = new Array ();
var map_state = MARKERS_STATE;

var occurrences_within_view = [];
var global_maxLng;
var global_minLng;
var global_maxLat;
var global_minLat;
var markers = [];

var where_conditions = [];

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
  data = [];

  for (var i = 0; i < result_set.length; i++) {
    data.push([result_set[i].LATITUDE, result_set[i].LONGITUDE, 200.]);
  }

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
    date_parts = date.split('-');

    return date_parts[2] + '/' + date_parts[1] + '/' + date_parts[0];
  }
  
  for (var i = 0; i < markers.length; i++) {//remove todas as ocorrencias q n estao na visao
    if (markers[i].position.lat < global_minLat || markers[i].position.lat > global_maxLat || markers[i].position.lat < global_minLng || markers[i].position.lat > global_maxLng) {
      markers[i].remove();
      markers.splice(i, 1);
      i = i-1;
    }
  }

  console.log(markers);
loop_rs:
  for (var i = 0; i < result_set.length; i++) {
loop_mark:
    for (var j = 0; j < markers.length; j++) {
      if (markers[j].id == result_set[i].ID) {
        console.log(markers[j].id + "; " + result_set[i].ID);
        continue loop_rs;
      }
    }
    
    markers.push({
      id: result_set[i].ID,
      position: {lat:result_set[i].LATITUDE, lng:result_set[i].LONGITUDE},
      title: result_set[i].RUBRIC,
      snippet: "...",
      icon: {
        url: "./icons/arma.png", // TODO Make images to each type
        size: {
          width: markers_icon_size,
          height: markers_icon_size
        },
        anchor: markers_icon_anchor
      }
    });
  }

  var labelOptions = {
    bold: true,
    fontSize: 15,
    color: "white"
  };

  //map_global.clear();

  map_global.addMarkerCluster({
    maxZoomLevel: 17.5,
    boundsDraw: false,
    markers: markers,
    icons: [
        {min: 2, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions}//,
        //{min: 11, max: 31, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions},
        //{min: 31, max: 91, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png", anchor: markers_icon_anchor, label:labelOptions},
        //{min: 91, max: 271, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png",anchor: markers_icon_anchor, label:labelOptions},
        //{min: 271, size: {height: markers_icon_size, width: markers_icon_size}, url: "./icons/arma_cluster_img.png",anchor: markers_icon_anchor, label:labelOptions}//,
        //{min: 91, url: "./icons/furto_celular.png",anchor: {x: 32,y: 32}}
    ]
  }).on(plugin.google.maps.event.MARKER_CLICK, function (position, marker) {
    if (marker.getSnippet() !== "...")
      return;
    
    db.transaction(function (tx) {
      var query = "SELECT occurrences.PERIOD, occurrences.DATE, occurrences.LINKED_NATURE FROM occurrences WHERE occurrences.ID=" + marker.get("id");

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
      },
      function (tx, error) {
          console.log('SELECT error: ' + error.message);
      });
    }, function (error) {
      console.log('transaction error: ' + error.message);
    }, function () {
      console.log('transaction ok');
    });
    
  });;
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

function getOccurrencesWithinRectangle(maxLng, minLng, maxLat, minLat) {
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

var result_set_eq;
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