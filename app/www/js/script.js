function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;
var db;

document.addEventListener("deviceready", function() {

  function open_occurrences_table_fn (db) {
    db.transaction(function (tx) {
      tx.executeSql(
        "CREATE TABLE Occurrences ( \
        BO_YEAR INTEGER NOT NULL, \
        BO_NUMBER INTEGER NOT NULL, \
        BO_BEGIN_TIME TEXT NOT NULL, \
        BO_EMISSION_TIME TEXT NOT NULL, \
        DATE TEXT NOT NULL, \
        PERIOD CHAR NOT NULL, \
        COMUNICATION_DATE TEXT NOT NULL, \
        ELABORATION_DATE TEXT NOT NULL, \
        BO_AUTHORSHIP CHAR NOT NULL, \
        IS_FLAGRANT BOOL NOT NULL, \
        ADDRESS_STREET TEXT NOT NULL, \
        ADDRESS_NUMBER INTEGER NOT NULL, \
        ADDRESS_DISTRICT TEXT NOT NULL, \
        ADDRESS_CITY TEXT NOT NULL, \
        ADDRESS_STATE TEXT NOT NULL, \
        LATITUDE REAL NOT NULL, \
        LONGITUDE REAL NOT NULL, \
        PLACE_DESCRIPTION TEXT NOT NULL, \
        EXAM TEXT NOT NULL, \
        SOLUTION INTEGER NOT NULL, \
        POLICE_STATION_NAME TEXT NOT NULL, \
        POLICE_STATION_CIRCUMSCRIPTION TEXT NOT NULL, \
        SPECIES TEXT NOT NULL, \
        RUBRIC TEXT NOT NULL, \
        UNFOLDING TEXT, \
        STATUS INTEGER NOT NULL, \
        PERSON_NAME TEXT, \
        PERSON_TYPE TEXT, \
        FATAL_VICTIM BOOL, \
        PERSON_RG TEXT, \
        PERSON_RG_STATE TEXT, \
        PERSON_NATURALNESS TEXT, \
        PERSON_NACIONALITY TEXT, \
        PERSON_SEX TEXT, \
        PERSON_DATE_OF_BIRTH TEXT, \
        PERSON_AGE INTEGER, \
        PERSON_CIVIL_STATE TEXT, \
        PERSON_JOB TEXT, \
        PERSON_INSTRUCTION_DEGREE TEXT, \
        PERSON_SKIN_COLOR TEXT, \
        LINKED_NATURE TEXT, \
        LINK_TYPE TEXT, \
        RELATIONSHIP TEXT, \
        KINSHIP TEXT, \
        VEHICLE_PLATE TEXT, \
        VEHICLE_STATE TEXT, \
        VEHICLE_CITY TEXT, \
        VEHICLE_DESCRIBED_COLOR TEXT, \
        VEHICLE_DESCRIBED_MODEL TEXT, \
        VEHICLE_FABRICATION_YEAR INTEGER, \
        VEHICLE_MODEL_YEAR INTEGER, \
        VEHICLE_DESCRIBED_TYPE TEXT, \
        PHONES_QUANTITY INTEGER, \
        PHONE_BRAND TEXT, \
        PRIMARY KEY (BO_YEAR, BO_NUMBER, POLICE_STATION_NAME) \
        ); \
        CREATE VIRTUAL TABLE occurrences_index USING rtree( \
          BO_YEAR, \
          BO_NUMBER, \
          POLICE_STATION_NAME, \
          minLng, maxLng, -- Minimum and maximum X coordinate \
          minLat, maxLat  -- Minimum and maximum Y  \
        );");
  }, function (error) {
      console.log('transaction error: ' + error.message);
  }, function () {
      console.log('transaction ok');
  });
};

  if (cordova.platformId == 'android') {
    StatusBar.overlaysWebView(true);
    StatusBar.backgroundColorByHexString('#33000000');
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default',
      androidDatabaseProvider: 'system'
    }, open_occurrences_table_fn,
    function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
    });
  }
  else {
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default'
    },
    open_occurrences_table_fn,
    function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
    });
  }

  $('#opcoes').sidenav({
    onOpenStart: function() {
    setVar('state','side_menu');
  }, 
  onCloseEnd: function() {
    setVar('state','home');
  }
  });
  $('#filtros').modal({
    onOpenStart: function() {
    setVar('state','filtros');
  }, onCloseEnd: function() {
    setVar('state','home');}});
  
  $('#pesquisa-btn-container').click(function(e) {
    $("#pesquisa-text-container").fadeIn(100);
    $("#pesquisa-text-container").css({width: (($(window).width()-40) + "px"),right:"20px"});
    $("#pesquisa-input").delay(500).fadeIn(100);
    $("#close-btn").delay(500).fadeIn(100);
    
    $("#menu-btn-container").fadeOut(200);
    $("#pesquisa-btn-container").css({display:"none"});
  }); //onclick="setVar('state','side_menu');"

  $('#close-btn').click(function(e) {
    $("#search_places").val("");
    $("#search_places").focus();
  });

  document.addEventListener("backbutton", onBackKeyDown, false);

  function onBackKeyDown() {
    var page_state = window.localStorage.getItem("state");
    switch (page_state) {
      case "search": {
        $("#pesquisa-input").fadeOut(100);
        $("#close-btn").fadeOut(100);
        $("#pesquisa-text-container").css({width:"56px",right:"23px"});
        $("#pesquisa-text-container").fadeOut(100);

        $("#menu-btn-container").fadeIn(200);
        $("#pesquisa-btn-container").css({display:"block"});

        setVar("state","home");
      }break;
      
      case "side_menu": {
        $("#opcoes").sidenav('close');
      }break;

      case "filtros": {
        $("#filtros").modal('close');
      }break;

      case "home": {
        navigator.app.exitApp();
      }break;

      default :{
        
      }
    }
  }

  var div = document.getElementById("map_canvas");
  // Create a Google Maps native view under the map_canvas div.
  var map = plugin.google.maps.Map.getMap(div, {
    'styles': [
      
      {
        "featureType": "poi",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [
          {
            "saturation": -25
          }
        ]
      },
      {
        "featureType": "poi.government",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "poi.medical",
        "stylers": [
          {
            "saturation": 70
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "stylers": [
          {
            "saturation": -55
          },
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels.text",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "transit",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      }
    ],
    'controls': {
      'compass': false,
      'rotateControl': false,
    },
    'gestures': {
      'tilt': true,
      'rotate': false,
      'zoom': true
    },
  });
  
  window.addEventListener('keyboardDidHide', function() {
    $(':text').blur();
  });

  function gotoPlace (place) {
    nativegeocoder.forwardGeocode(gogo, epicfail, place, { useLocale: true, maxResults: 1 });

    function gogo(coordinates) {
      var firstResult = coordinates[0];
      map.animateCamera({
        target: {lat:firstResult.latitude, lng:firstResult.longitude},
        zoom: 13,
        tilt: 30,
        bearing: 0,
        duration: 1000
      }, function() {
      });
    }

    function epicfail(err) {
      console.log(err);
    }
  }
  
  $("#search_places").on("keypress", function(event){
    if (event.which  == 13) {
      var place_to_go = $("#search_places").val();
      gotoPlace(place_to_go);
      Keyboard.hide();
      event.preventDefault();
    }
  });

  setVar("state","home");
  map.one(plugin.google.maps.event.MAP_READY, onMapInit);
  map_global = map;
});

const HEATMAP = {id: -1, path_img: ""};
const FURTO_CELULAR = {id: 0, path_img: "./icons/arma.png"};
const ROUBO_CELULAR = {id: 1, path_img: "./icons/arma.png"};
const FURTO_VEICULOS = {id: 2, path_img: "./icons/arma.png"};
const ROUBO_VEICULOS = {id: 3, path_img: "./icons/arma.png"};
const LATROCINIO = {id: 4, path_img: "./icons/arma.png"};
const LESAO_CORPORAL_SEGUIDA_DE_MORTE = {id: 5, path_img: "./icons/arma.png"};
const HOMICIDIO_DOLOSO = {id: 6, path_img: "./icons/arma.png"};

var occurrences_jsons = new Array ();

function to_marker() {
  map_global.clear();

  $.each( occurrences_jsons, function(key,value) {
    mapear_marker(value.dir_json, value.tipo);
  });
}

function to_heatmap() {
  map_global.clear();
  
  $.each( occurrences_jsons, function(key,value) {
    mapear_heatmap(value.dir_json, value.tipo);
  });
}


function mapear_heatmap (dir_json, tipo) {
  occurrences_jsons.push({tipo: tipo, dir_json: dir_json});

  $.getJSON( dir_json, function( data ) {
    var heatmapData = [];
    $.each( data, function(key,value) {
      if (value.LATITUDE != "") {
        heatmapData.push([parseFloat(value.LATITUDE.replace(",",".")), parseFloat(value.LONGITUDE.replace(",",".")), 5]);}
      else
      {
        console.log("Sem coordenadas");
      }});

      console.log(heatmapData);
      map_global.addHeatmap({
        data: heatmapData,
        radius: 20
      });
    });
}

function mapear_marker (dir_json, tipo) {
  occurrences_jsons.push({tipo: tipo, dir_json: dir_json});

  $.getJSON( dir_json, function( data ) {
    $.each( data, function(key,value) {
      if (value.LATITUDE != "") {
        map_global.addMarker({
          position: {lat:parseFloat(value.LATITUDE.replace(",",".")), lng:parseFloat(value.LONGITUDE.replace(",","."))},
          title: value.RUBRICA,
          icon: {
            url: tipo.path_img,
            size: {
              width: 56,
              height: 56
            },
            anchor: {x: 23,y: 46}
          }
        });
      } else {
        console.log("Sem coordenadas");
      }
    });
  });
}

/*function insert_json_in_db (db, dir_json, tipo) {
  occurrences_jsons.push({tipo: tipo, dir_json: dir_json});

  $.getJSON( dir_json, function( data ) {
    $.each( data, function(key,value) {
      if (value.LATITUDE != "") {
        var occurrence = {
          BO_YEAR: value.ANO_BO,
          BO_NUMBER: value.NUM_BO,
          BO_BEGIN_TIME: value.BO_INICIADO,
          BO_EMISSION_TIME: value.BO_EMITIDO,
          DATE: convert_date_format(value.DATAOCORRENCIA),
          PERIOD: convert_period(value.PERIDOCORRENCIA),
          COMUNICATION_DATE, ELABORATION_DATE, BO_AUTHORSHIP, IS_FLAGRANT, ADDRESS_STREET, ADDRESS_NUMBER, ADDRESS_DISTRICT, ADDRESS_CITY, ADDRESS_STATE, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, EXAM, SOLUTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, SPECIES, RUBRIC, UNFOLDING, STATUS, PERSON_NAME, PERSON_TYPE, FATAL_VICTIM, PERSON_RG, PERSON_RG_STATE, PERSON_NATURALNESS, PERSON_NACIONALITY, PERSON_SEX, PERSON_DATE_OF_BIRTH, PERSON_AGE, PERSON_CIVIL_STATE, PERSON_JOB, PERSON_INSTRUCTION_DEGREE, PERSON_SKIN_COLOR, LINKED_NATURE, LINK_TYPE, RELATIONSHIP,KINSHIP, VEHICLE_PLATE, VEHICLE_STATE, VEHICLE_CITY, VEHICLE_DESCRIBED_COLOR, VEHICLE_DESCRIBED_MODEL, VEHICLE_FABRICATION_YEAR, VEHICLE_MODEL_YEAR, VEHICLE_DESCRIBED_TYPE, PHONES_QUANTITY, PHONE_BRAND 
        }
        map_global.addMarker({
          position: {lat:parseFloat(value.LATITUDE.replace(",",".")), lng:parseFloat(value.LONGITUDE.replace(",","."))},
          title: value.RUBRICA,
          icon: {
            url: tipo.path_img,
            size: {
              width: 56,
              height: 56
            },
            anchor: {x: 23,y: 46}
          }
        });
      } else {
        console.log("Sem coordenadas");
      }
    });
  });
}*/

//mapear_marker("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", ROUBO_CELULAR);

function onMapInit (map) {
  map.animateCamera({
    target: {lat:-22.9064, lng:-47.0616 },
    zoom: 13,
    tilt: 30,
    bearing: 0,
    duration: 0
  }, function() {
  });
  /*map.getMyLocation(function(location) {
    map.animateCamera({
      target: location.latLng,
      zoom: 13,
      tilt: 30,
      bearing: 0,
      duration: 1000
    }, function() {
    });
  }, function() {

  });*/
  mapear_marker("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", ROUBO_CELULAR);
}

function addOccurrence(occurrence) {
      db.transaction(function (tx) {
  
          var query = "INSERT INTO occurrences (BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, COMUNICATION_DATE, ELABORATION_DATE, BO_AUTHORSHIP, IS_FLAGRANT, ADDRESS_STREET, ADDRESS_NUMBER, ADDRESS_DISTRICT, ADDRESS_CITY, ADDRESS_STATE, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, EXAM, SOLUTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, SPECIES, RUBRIC, UNFOLDING, STATUS, PERSON_NAME, PERSON_TYPE, FATAL_VICTIM, PERSON_RG, PERSON_RG_STATE, PERSON_NATURALNESS, PERSON_NACIONALITY, PERSON_SEX, PERSON_DATE_OF_BIRTH, PERSON_AGE, PERSON_CIVIL_STATE, PERSON_JOB, PERSON_INSTRUCTION_DEGREE, PERSON_SKIN_COLOR, LINKED_NATURE, LINK_TYPE, RELATIONSHIP,KINSHIP, VEHICLE_PLATE, VEHICLE_STATE, VEHICLE_CITY, VEHICLE_DESCRIBED_COLOR, VEHICLE_DESCRIBED_MODEL, VEHICLE_FABRICATION_YEAR, VEHICLE_MODEL_YEAR, VEHICLE_DESCRIBED_TYPE, PHONES_QUANTITY, PHONE_BRAND) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
  
          var occurrence_array = [
            occurrence.BO_YEAR, occurrence.BO_NUMBER, occurrence.BO_BEGIN_TIME, occurrence.BO_EMISSION_TIME, occurrence.DATE, occurrence.PERIOD, occurrence.COMUNICATION_DATE, occurrence.ELABORATION_DATE, occurrence.BO_AUTHORSHIP, occurrence.IS_FLAGRANT, occurrence.ADDRESS_STREET, occurrence.ADDRESS_NUMBER, occurrence.ADDRESS_DISTRICT, occurrence.ADDRESS_CITY, occurrence.ADDRESS_STATE, occurrence.LATITUDE, occurrence.LONGITUDE, occurrence.PLACE_DESCRIPTION, occurrence.EXAM, occurrence.SOLUTION, occurrence.POLICE_STATION_NAME, occurrence.POLICE_STATION_CIRCUMSCRIPTION, occurrence.SPECIES, occurrence.RUBRIC, occurrence.UNFOLDING, occurrence.STATUS, occurrence.PERSON_NAME, occurrence.PERSON_TYPE, occurrence.FATAL_VICTIM, occurrence.PERSON_RG, occurrence.PERSON_RG_STATE, occurrence.PERSON_NATURALNESS, occurrence.PERSON_NACIONALITY, occurrence.PERSON_SEX, occurrence.PERSON_DATE_OF_BIRTH, occurrence.PERSON_AGE, occurrence.PERSON_CIVIL_STATE, occurrence.PERSON_JOB, occurrence.PERSON_INSTRUCTION_DEGREE, occurrence.PERSON_SKIN_COLOR, occurrence.LINKED_NATURE, occurrence.LINK_TYPE, occurrence.RELATIONSHIP,KINSHIP, occurrence.VEHICLE_PLATE, occurrence.VEHICLE_STATE, occurrence.VEHICLE_CITY, occurrence.VEHICLE_DESCRIBED_COLOR, occurrence.VEHICLE_DESCRIBED_MODEL, occurrence.VEHICLE_FABRICATION_YEAR, occurrence.VEHICLE_MODEL_YEAR, occurrence.VEHICLE_DESCRIBED_TYPE, occurrence.PHONES_QUANTITY, occurrence.PHONE_BRAND
          ];

          tx.executeSql(query, occurrence_array, function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
          },
          function(tx, error) {
              console.log('INSERT error: ' + error.message);
          });

          query = "INSERT INTO occurrences_index (BO_YEAR, BO_NUMBER, POLICE_STATION_NAME, minLng, maxLng, minLat, maxLat) VALUES (?,?,?,?,?,?,?);";
          
          occurrence_array = [
            occurrence.BO_YEAR, occurrence.BO_NUMBER, occurrence.POLICE_STATION_NAME, occurrence.LONGITUDE, occurrence.LONGITUDE, occurrence.LATITUDE, occurrence.LATITUDE
          ];

          tx.executeSql(query, occurrence_array, function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
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
  
          var query = "SELECT occurrences.BO_YEAR, occurrences.BO_NUMBER, occurrences.BO_BEGIN_TIME, occurrences.BO_EMISSION_TIME, occurrences.DATE, occurrences.PERIOD, occurrences.COMUNICATION_DATE, occurrences.ELABORATION_DATE, occurrences.BO_AUTHORSHIP, occurrences.IS_FLAGRANT, occurrences.ADDRESS_STREET, occurrences.ADDRESS_NUMBER, occurrences.ADDRESS_DISTRICT, occurrences.ADDRESS_CITY, occurrences.ADDRESS_STATE, occurrences.LATITUDE, occurrences.LONGITUDE, occurrences.PLACE_DESCRIPTION, occurrences.EXAM, occurrences.SOLUTION, occurrences.POLICE_STATION_NAME, occurrences.POLICE_STATION_CIRCUMSCRIPTION, occurrences.SPECIES, occurrences.RUBRIC, occurrences.UNFOLDING, occurrences.STATUS, occurrences.PERSON_NAME, occurrences.PERSON_TYPE, occurrences.FATAL_VICTIM, occurrences.PERSON_RG, occurrences.PERSON_RG_STATE, occurrences.PERSON_NATURALNESS, occurrences.PERSON_NACIONALITY, occurrences.PERSON_SEX, occurrences.PERSON_DATE_OF_BIRTH, occurrences.PERSON_AGE, occurrences.PERSON_CIVIL_STATE, occurrences.PERSON_JOB, occurrences.PERSON_INSTRUCTION_DEGREE, occurrences.PERSON_SKIN_COLOR, occurrences.LINKED_NATURE, occurrences.LINK_TYPE, occurrences.RELATIONSHIP,KINSHIP, occurrences.VEHICLE_PLATE, occurrences.VEHICLE_STATE, occurrences.VEHICLE_CITY, occurrences.VEHICLE_DESCRIBED_COLOR, occurrences.VEHICLE_DESCRIBED_MODEL, occurrences.VEHICLE_FABRICATION_YEAR, occurrences.VEHICLE_MODEL_YEAR, occurrences.VEHICLE_DESCRIBED_TYPE, occurrences.PHONES_QUANTITY, occurrences.PHONE_BRAND FROM occurrences, occurrences_index WHERE occurrences.BO_YEAR=occurrences.BO_YEAR AND occurrences.BO_NUMBER=occurrences.BO_NUMBER AND occurrences.POLICE_STATION_NAME=occurrences.POLICE_STATION_NAME AND occurrences_index.maxLng>=(?) AND occurrences_index.minLng<=(?) AND occurrences_index.maxLat>=(?)  AND occurrences_index.minLat<=(?);";

          var ret_result_set;
          tx.executeSql(query, [maxLng, minLng, maxLat, minLat], function (tx, resultSet) {
            ret_result_set = resultSet;
            return;
            /*for(var i = 0; x < resultSet.rows.length; i++) {
                console.log("First name: " + resultSet.rows.item(i).firstname +
                    ", Acct: " + resultSet.rows.item(i).acctNo);
            }*/
          },
          function (tx, error) {
              console.log('SELECT error: ' + error.message);
          });
      }, function (error) {
          console.log('transaction error: ' + error.message);
      }, function () {
          console.log('transaction ok');
      });

      return ret_result_set;
  }