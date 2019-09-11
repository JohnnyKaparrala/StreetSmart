function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;

document.addEventListener("deviceready", function() {
  if (cordova.platformId == 'android') {
    StatusBar.overlaysWebView(true);
    StatusBar.backgroundColorByHexString('#33000000');
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