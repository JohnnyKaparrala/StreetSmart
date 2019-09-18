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

function getOccurrencesWithinView(result_set) {
  occurrences_within_view = [];

  for (var i = 0; i < result_set.rows.length; i++) {
    occurrences_within_view.push(result_set.rows.item(i));
  }

  switch (map_state) {
    case MARKERS_STATE:
      to_marker();
      break;
    case HEATMAP_STATE:
      to_heatmap();
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

var window_min_length = Math.min(window.innerHeight, window.innerWidth)/100; //TODO Use phone's dpi
var markers_size = 15 * window_min_length;
var markers_anchor = {x: 23,y: 46};
function map_marker_with_result_set (result_set) {
  var markers = [];
  for (var i = 0; i < result_set.length; i++) {
    markers.push({
      position: {lat:result_set[i].LATITUDE, lng:result_set[i].LONGITUDE},
      title: (result_set[i].LINKED_NATURE && result_set[i].LINKED_NATURE != "" ? 
      result_set[i].LINKED_NATURE : (result_set[i].RUBRIC && result_set[i].RUBRIC != "" ? result_set[i].RUBRIC : "Sem título")),
      icon: {
        url: "./icons/arma.png", // TODO Make images to each type
        size: {
          width: markers_size,
          height: markers_size
        },
        anchor: markers_anchor
      }
    });
      /*map_global.addMarker({
        position: {lat:result_set[i].LATITUDE, lng:result_set[i].LONGITUDE},
        title: (result_set[i].LINKED_NATURE && result_set[i].LINKED_NATURE != "" ? 
        result_set[i].LINKED_NATURE : (result_set[i].RUBRIC && result_set[i].RUBRIC != "" ? result_set[i].RUBRIC : "Sem título")),
        icon: {
          url: "./icons/arma.png", // TODO Make images to each type
          size: {
            width: 56,
            height: 56
          },
          anchor: {x: 23,y: 46}
        }
      });*/
  }

  map_global.addMarkerCluster({
    boundsDraw: false,
    markers: markers,
    icons: [
        {min: 2, max: 11, size: {height: markers_size, width: markers_size}, url: "./icons/furto_celular.png", anchor: markers_anchor},
        {min: 11, max: 31, size: {height: markers_size, width: markers_size}, url: "./icons/furto_carro.png", anchor: markers_anchor},
        {min: 31, max: 91, size: {height: markers_size, width: markers_size}, url: "./icons/roubo_celular.png", anchor: markers_anchor},
        {min: 91, max: 271, size: {height: markers_size, width: markers_size}, url: "./icons/roubo_carro.png",anchor: markers_anchor},
        {min: 271, size: {height: markers_size, width: markers_size}, url: "./icons/furto_celular.png",anchor: markers_anchor}//,
        //{min: 91, url: "./icons/furto_celular.png",anchor: {x: 32,y: 32}}
    ]
  });
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
  db.transaction(function (tx) {
      var query = "SELECT occurrences.BO_YEAR, occurrences.BO_NUMBER, occurrences.BO_BEGIN_TIME, occurrences.BO_EMISSION_TIME, occurrences.DATE, occurrences.PERIOD, occurrences.IS_FLAGRANT, occurrences.ADDRESS_STREET, occurrences.ADDRESS_NUMBER, occurrences.ADDRESS_DISTRICT, occurrences.ADDRESS_CITY, occurrences.ADDRESS_STATE, occurrences.LATITUDE, occurrences.LONGITUDE, occurrences.PLACE_DESCRIPTION, occurrences.POLICE_STATION_NAME, occurrences.POLICE_STATION_CIRCUMSCRIPTION, occurrences.RUBRIC, occurrences.FATAL_VICTIM, occurrences.PERSON_SEX, occurrences.PERSON_AGE, occurrences.PERSON_SKIN_COLOR, occurrences.LINKED_NATURE FROM occurrences, occurrences_index WHERE occurrences.ID=occurrences_index.ID AND occurrences_index.maxLng<=(?) AND occurrences_index.minLng>=(?) AND occurrences_index.maxLat<=(?) AND occurrences_index.minLat>=(?);";

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

function insert_json_in_db (dir_json) {
  function convert_date_format(date) {
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
          BO_BEGIN_TIME: (value.BO_INICIADO != "" ? convert_date_format(value.BO_INICIADO) : null),
          BO_EMISSION_TIME: (value.BO_EMITIDO != "" ? convert_date_format(value.BO_EMITIDO) : null),
          DATE: (value.DATAOCORRENCIA != "" ? convert_date_format(value.DATAOCORRENCIA) : null),
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