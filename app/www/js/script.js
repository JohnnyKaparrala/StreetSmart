function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;
var db;

document.addEventListener("deviceready", function() {
  if (cordova.platformId == 'android') {
    StatusBar.overlaysWebView(true);
    StatusBar.backgroundColorByHexString('#33000000');
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default',
      androidDatabaseProvider: 'system'
    }, function() {},
    function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
    });
  }
  else {
    db = window.sqlitePlugin.openDatabase({
      name: 'occurrences.db',
      location: 'default'
    },
    function() {},
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
  var map_style_object;
  $.getJSON("js/map_style.json", function(result) {
    map_style_object = result;
  });

  var map = plugin.google.maps.Map.getMap(div, map_style_object);
  
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
const MARKERS_STATE = 0;
const HEATMAP_STATE = 1;

var occurrences_jsons = new Array ();
var map_state = MARKERS_STATE;
var occurrences_within_view = [];

function to_marker(/*use_json_or_result_set*/) {
  //use_json_or_result_set = (typeof use_json_or_result_set !== 'undefined' ? use_json_or_result_set : true);
  map_state = MARKERS_STATE;
  map_global.clear();

  /*if (use_json_or_result_set) {
    $.each( occurrences_jsons, function(key,value) {
      mapear_marker(value.dir_json, value.tipo);
    });
  }
  else {
    map_marker_with_result_set(occurrences_within_view);
  }*/
  map_marker_with_result_set(occurrences_within_view);
}

function to_heatmap(/*use_json_or_result_set*/) {
  //use_json_or_result_set = (typeof use_json_or_result_set !== 'undefined' ? use_json_or_result_set : true);
  map_state = HEATMAP_STATE;
  map_global.clear();
  
  /*if (use_json_or_result_set) {
    $.each( occurrences_jsons, function(key,value) {
      mapear_heatmap(value.dir_json, value.tipo);
    });
  }
  else {
    map_heatmap_with_result_set(occurrences_within_view);
  }*/
  map_heatmap_with_result_set(occurrences_within_view);
}

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

/*function mapear_heatmap (dir_json, tipo) {
  $.getJSON( dir_json, function( data ) {
    var heatmapData = [];
    $.each( data, function(key,value) {
      if (value.LATITUDE != "") {
        heatmapData.push([parseFloat(value.LATITUDE.replace(",",".")), parseFloat(value.LONGITUDE.replace(",",".")), 5]);}
      else
      {
        console.log("Sem coordenadas");
      }});

      map_global.addHeatmap({
        data: heatmapData,
        radius: 20
      });
    });
}*/

function map_heatmap_with_result_set (result_set) {
  data = [];

  for (var i = 0; i < result_set.length; i++) {
    data.push([result_set[i].LATITUDE, result_set[i].LONGITUDE]); // TODO Check if it's float or string
  }

  map_global.addHeatmap({
    data: data,
    radius: 20
  });
}

/*function mapear_marker (dir_json, tipo) {
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
}*/

function map_marker_with_result_set (result_set) {
  for (var i = 0; i < result_set.length; i++) {
      map_global.addMarker({
        position: {lat:result_set[i].LATITUDE, lng:result_set[i].LONGITUDE},
        title: result_set[i].RUBRIC,
        icon: {
          url: "./icons/arma.png", // TODO Make images to each type
          size: {
            width: 56,
            height: 56
          },
          anchor: {x: 23,y: 46}
        }
      });
  }
}

function addOccurrence(occurrence) {
  db.transaction(function (tx) {

      var query = "INSERT INTO occurrences (BO_YEAR, BO_NUMBER, BO_BEGIN_TIME, BO_EMISSION_TIME, DATE, PERIOD, COMUNICATION_DATE, ELABORATION_DATE, BO_AUTHORSHIP, IS_FLAGRANT, ADDRESS_STREET, ADDRESS_NUMBER, ADDRESS_DISTRICT, ADDRESS_CITY, ADDRESS_STATE, LATITUDE, LONGITUDE, PLACE_DESCRIPTION, EXAM, SOLUTION, POLICE_STATION_NAME, POLICE_STATION_CIRCUMSCRIPTION, SPECIES, RUBRIC, UNFOLDING, STATUS, PERSON_NAME, PERSON_TYPE, FATAL_VICTIM, PERSON_RG, PERSON_RG_STATE, PERSON_NATURALNESS, PERSON_NACIONALITY, PERSON_SEX, PERSON_DATE_OF_BIRTH, PERSON_AGE, PERSON_CIVIL_STATE, PERSON_JOB, PERSON_INSTRUCTION_DEGREE, PERSON_SKIN_COLOR, LINKED_NATURE, LINK_TYPE, RELATIONSHIP,KINSHIP, VEHICLE_PLATE, VEHICLE_STATE, VEHICLE_CITY, VEHICLE_DESCRIBED_COLOR, VEHICLE_DESCRIBED_MODEL, VEHICLE_FABRICATION_YEAR, VEHICLE_MODEL_YEAR, VEHICLE_DESCRIBED_TYPE, PHONES_QUANTITY, PHONE_BRAND) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

      var occurrence_array = [
        occurrence.BO_YEAR, occurrence.BO_NUMBER, 
        occurrence.BO_BEGIN_TIME, occurrence.BO_EMISSION_TIME, 
        occurrence.DATE, occurrence.PERIOD, 
        occurrence.COMUNICATION_DATE, occurrence.ELABORATION_DATE, 
        occurrence.BO_AUTHORSHIP, occurrence.IS_FLAGRANT, 
        occurrence.ADDRESS_STREET, occurrence.ADDRESS_NUMBER, 
        occurrence.ADDRESS_DISTRICT, occurrence.ADDRESS_CITY, 
        occurrence.ADDRESS_STATE, occurrence.LATITUDE, 
        occurrence.LONGITUDE, occurrence.PLACE_DESCRIPTION, 
        occurrence.EXAM, occurrence.SOLUTION, 
        occurrence.POLICE_STATION_NAME, occurrence.POLICE_STATION_CIRCUMSCRIPTION,
        occurrence.SPECIES, occurrence.RUBRIC, 
        occurrence.UNFOLDING, occurrence.STATUS, 
        occurrence.PERSON_NAME, occurrence.PERSON_TYPE, 
        occurrence.FATAL_VICTIM, occurrence.PERSON_RG, 
        occurrence.PERSON_RG_STATE, occurrence.PERSON_NATURALNESS, 
        occurrence.PERSON_NACIONALITY, occurrence.PERSON_SEX, 
        occurrence.PERSON_DATE_OF_BIRTH, occurrence.PERSON_AGE, 
        occurrence.PERSON_CIVIL_STATE, occurrence.PERSON_JOB, 
        occurrence.PERSON_INSTRUCTION_DEGREE, occurrence.PERSON_SKIN_COLOR, 
        occurrence.LINKED_NATURE, occurrence.LINK_TYPE, 
        occurrence.RELATIONSHIP, occurrence.KINSHIP, 
        occurrence.VEHICLE_PLATE, occurrence.VEHICLE_STATE, 
        occurrence.VEHICLE_CITY, occurrence.VEHICLE_DESCRIBED_COLOR, 
        occurrence.VEHICLE_DESCRIBED_MODEL, occurrence.VEHICLE_FABRICATION_YEAR, 
        occurrence.VEHICLE_MODEL_YEAR, occurrence.VEHICLE_DESCRIBED_TYPE, 
        occurrence.PHONES_QUANTITY, occurrence.PHONE_BRAND
      ];

      tx.executeSql(query, occurrence_array, function(tx, res) {
          console.log("insertId: " + res.insertId + " -- probably 1");
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
      var query = "SELECT occurrences.BO_YEAR, occurrences.BO_NUMBER, occurrences.BO_BEGIN_TIME, occurrences.BO_EMISSION_TIME, occurrences.DATE, occurrences.PERIOD, occurrences.COMUNICATION_DATE, occurrences.ELABORATION_DATE, occurrences.BO_AUTHORSHIP, occurrences.IS_FLAGRANT, occurrences.ADDRESS_STREET, occurrences.ADDRESS_NUMBER, occurrences.ADDRESS_DISTRICT, occurrences.ADDRESS_CITY, occurrences.ADDRESS_STATE, occurrences.LATITUDE, occurrences.LONGITUDE, occurrences.PLACE_DESCRIPTION, occurrences.EXAM, occurrences.SOLUTION, occurrences.POLICE_STATION_NAME, occurrences.POLICE_STATION_CIRCUMSCRIPTION, occurrences.SPECIES, occurrences.RUBRIC, occurrences.UNFOLDING, occurrences.STATUS, occurrences.PERSON_NAME, occurrences.PERSON_TYPE, occurrences.FATAL_VICTIM, occurrences.PERSON_RG, occurrences.PERSON_RG_STATE, occurrences.PERSON_NATURALNESS, occurrences.PERSON_NACIONALITY, occurrences.PERSON_SEX, occurrences.PERSON_DATE_OF_BIRTH, occurrences.PERSON_AGE, occurrences.PERSON_CIVIL_STATE, occurrences.PERSON_JOB, occurrences.PERSON_INSTRUCTION_DEGREE, occurrences.PERSON_SKIN_COLOR, occurrences.LINKED_NATURE, occurrences.LINK_TYPE, occurrences.RELATIONSHIP,KINSHIP, occurrences.VEHICLE_PLATE, occurrences.VEHICLE_STATE, occurrences.VEHICLE_CITY, occurrences.VEHICLE_DESCRIBED_COLOR, occurrences.VEHICLE_DESCRIBED_MODEL, occurrences.VEHICLE_FABRICATION_YEAR, occurrences.VEHICLE_MODEL_YEAR, occurrences.VEHICLE_DESCRIBED_TYPE, occurrences.PHONES_QUANTITY, occurrences.PHONE_BRAND FROM occurrences, occurrences_index WHERE occurrences.ID=occurrences_index.ID AND occurrences_index.maxLng<=(?) AND occurrences_index.minLng>=(?) AND occurrences_index.maxLat<=(?) AND occurrences_index.minLat>=(?);";

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

  function convert_authorship(authorship) {
    authorship = authorship.toLowerCase();

    switch (authorship) {
      case "desconhecida":
        return 'U';
      case "conhecida":
        return 'K';
    }
  }

  function convert_yes_no_to_bool(yes_no) {
    yes_no = yes_no[0].toUpperCase();

    return yes_no == "S";
  }

  function convert_status(status) {
    return status[0].toUpperCase();
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
  
  function convert_civil_state(civil_state) {
    civil_state = civil_state.toLowerCase().replace("ã", "a").replace("á", "a");

    switch (civil_state) {
      case "casado":
        return 'M';
      case "solteiro":
        return 'S';
      case "uniao estavel":
        return 'U';
      case "divorciado":
        return 'D';
      case "ignorado":
        return 'I';  
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
          COMUNICATION_DATE: (value.DATACOMUNICACAO != "" ? convert_date_format(value.DATACOMUNICACAO) : null),
          ELABORATION_DATE: (value.DATAELABORACAO != "" ? convert_date_format(value.DATAELABORACAO) : null),
          BO_AUTHORSHIP: (value.BO_AUTORIA != "" ? convert_authorship(value.BO_AUTORIA) : null),
          IS_FLAGRANT: (value.FLAGRANTE != "" ? convert_yes_no_to_bool(value.FLAGRANTE) : null),
          ADDRESS_STREET: (value.LOGRADOURO != "" ? value.LOGRADOURO : null),
          ADDRESS_NUMBER: (value.NUMERO != "" ? parseInt(value.NUMERO) : null),
          ADDRESS_DISTRICT: (value.BAIRRO != "" ? value.BAIRRO : null),
          ADDRESS_CITY: (value.CIDADE != "" ? value.CIDADE : null),
          ADDRESS_STATE: (value.UF != "" ? value.UF : null),
          LATITUDE: (value.LATITUDE != "" ? parseFloat(value.LATITUDE.replace(",",".")) : null),
          LONGITUDE: (value.LONGITUDE != "" ? parseFloat(value.LONGITUDE.replace(",",".")) : null),
          PLACE_DESCRIPTION: (value.DESCRICAOLOCAL != "" ? value.DESCRICAOLOCAL : null),
          EXAM: (value.EXAME != "" ? value.EXAME : null),
          SOLUTION: (value.SOLUCAO && value.SOLUCAO != "" ? value.SOLUCAO : null),
          POLICE_STATION_NAME: (value.DELEGACIA_NOME != "" ? value.DELEGACIA_NOME : null),
          POLICE_STATION_CIRCUMSCRIPTION: (value.DELEGACIA_CIRCUNSCRICAO != "" ? value.DELEGACIA_CIRCUNSCRICAO : null),
          SPECIES: (value.ESPECIE != "" ? value.ESPECIE : null),
          RUBRIC: (value.RUBRICA != "" ? value.RUBRICA : null),
          UNFOLDING: (value.DESDOBRAMENTO != "" ? value.DESDOBRAMENTO : null),
          STATUS: (value.STATUS != "" ? convert_status(value.STATUS) : null),
          PERSON_NAME: (value.NOMEPESSOA != "" ? value.NOMEPESSOA : null),
          PERSON_TYPE: (value.TIPOPESSOA != "" ? value.TIPOPESSOA : null),
          FATAL_VICTIM: (value.VITIMAFATAL != "" ? convert_yes_no_to_bool(value.VITIMAFATAL) : null),
          PERSON_RG: (value.RG != "" ? value.RG : null),
          PERSON_RG_STATE: (value.RG_UF != "" ? value.RG_UF : null),
          PERSON_NATURALNESS: (value.NATURALIDADE != "" ? value.NATURALIDADE : null),
          PERSON_NACIONALITY: (value.NACIONALIDADE != "" ? value.NACIONALIDADE : null),
          PERSON_SEX: (value.SEXO != "" ? convert_person_sex(value.SEXO) : null),
          PERSON_DATE_OF_BIRTH: (value.DATANASCIMENTO != "" ? convert_date_format(value.DATANASCIMENTO) : null),
          PERSON_AGE: (value.IDADE != "" ? parseInt(value.IDADE) : null),
          PERSON_CIVIL_STATE: (value.ESTADOCIVIL != "" ? convert_civil_state(value.ESTADOCIVIL) : null),
          PERSON_JOB: (value.PROFISSAO != "" ? value.PROFISSAO : null),
          PERSON_INSTRUCTION_DEGREE: (value.GRAUINSTRUCAO != "" ? value.GRAUINSTRUCAO : null),
          PERSON_SKIN_COLOR: (value.CORCUTIS != "" ? convert_skin_color(value.CORCUTIS) : null),
          LINKED_NATURE: (value.NATUREZAVINCULADA != "" ? value.NATUREZAVINCULADA : null),
          LINK_TYPE: (value.TIPOVINCULO != "" ? value.TIPOVINCULO : null),
          RELATIONSHIP: (value.RELACIONAMENTO != "" ? value.RELACIONAMENTO : null),
          KINSHIP: (value.PARENTESCO != "" ? value.PARENTESCO : null),
          VEHICLE_PLATE: (value.PLACA_VEICULO != "" ? value.PLACA_VEICULO : null),
          VEHICLE_STATE: (value.UF_VEICULO != "" ? value.UF_VEICULO : null),
          VEHICLE_CITY: (value.CIDADE_VEICULO != "" ? value.CIDADE_VEICULO : null),
          VEHICLE_DESCRIBED_COLOR: (value.DESCR_COR_VEICULO != "" ? value.DESCR_COR_VEICULO : null),
          VEHICLE_DESCRIBED_MODEL: (value.DESCR_MARCA_VEICULO != "" ? value.DESCR_MARCA_VEICULO : null),
          VEHICLE_FABRICATION_YEAR: (value.ANO_FABRICACAO != "" ? parseInt(value.ANO_FABRICACAO) : null),
          VEHICLE_MODEL_YEAR: (value.ANO_MODELO != "" ? parseInt(value.ANO_MODELO) : null),
          VEHICLE_DESCRIBED_TYPE: (value.DESCR_TIPO_VEICULO != "" ? value.DESCR_TIPO_VEICULO : null),
          PHONES_QUANTITY: (value.QUANT_CELULAR != "" ? parseInt(value.QUANT_CELULAR) : null),
          PHONE_BRAND: (value.MARCA_CELULAR != "" ? value.MARCA_CELULAR : null)
        }

        addOccurrence(occurrence);
      } else {
        console.log("Sem coordenadas");
      }
    });
  });
}

//mapear_marker("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", ROUBO_CELULAR);

var delta_function = function (zoom) {
  return 353.3062702684 * Math.exp(-0.6760301423 * zoom);
}

function onMapInit (map) {
  map.on(plugin.google.maps.event.CAMERA_MOVE_END, function(cameraPosition) {
    var delta = delta_function(cameraPosition.zoom);
    //console.log("zoom: " + cameraPosition.zoom);
    console.log("delta: " + delta);

    if (delta <= 0.1)
      getOccurrencesWithinRectangle(cameraPosition.target.lng + delta, cameraPosition.target.lng - delta, cameraPosition.target.lat + delta, cameraPosition.target.lat - delta);

    /*map_global.addMarker({
      position: {lat:cameraPosition.target.lat + delta, lng:cameraPosition.target.lng + delta},
      title: "Test upper right limit of view rectangle",
      icon: {
        url: "./icons/transparent_red_circle.png",
        size: {
          width: 56,
          height: 56
        },
        anchor: {x: 23,y: 46}
      }
    });

    map_global.addMarker({
      position: {lat:cameraPosition.target.lat - delta, lng:cameraPosition.target.lng - delta},
      title: "Test lower left limit of view rectangle",
      icon: {
        url: "./icons/transparent_red_circle.png",
        size: {
          width: 56,
          height: 56
        },
        anchor: {x: 23,y: 46}
      }
    });*/
  });

  map.animateCamera({
    target: {lat:-22.9064, lng:-47.0616 },
    zoom: 13,
    tilt: 1e-20,
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
  //mapear_marker("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", ROUBO_CELULAR);
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