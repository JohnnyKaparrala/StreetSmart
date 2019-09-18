function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;
var db;

document.addEventListener("deviceready", function() {
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


//mapear_marker("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", ROUBO_CELULAR);

var delta_function = function (zoom) {
  return 353.306270268435128 * Math.exp(-0.676030142340657 * zoom);
}

var previous_camera_position;
var previous_delta;
var dist = 0.6;
var zoom_change = 0.05;
function onMapInit (map) {
  map.on(plugin.google.maps.event.CAMERA_MOVE_END, function(cameraPosition) {
    var delta = delta_function(cameraPosition.zoom);

    var moved_camera_considerably = true;
    var changed_zoom_considerably = true;
    if (previous_camera_position)
    {
      var d_y = (previous_camera_position.target.lat - cameraPosition.target.lat);
      var d_x = (previous_camera_position.target.lng - cameraPosition.target.lng);
      var distance = Math.sqrt(d_x * d_x + d_y * d_y);

      //console.log("distance/delta: " + (distance/delta));
      
      moved_camera_considerably = ((distance/delta) > dist);
    }
    if (previous_delta) {
      //console.log("delta difference: " + (Math.abs(delta - previous_delta)));
      changed_zoom_considerably = (Math.abs(delta - previous_delta) > zoom_change);
    }

    //console.log("moved_camera_considerably: " + moved_camera_considerably + "; changed_zoom_considerably: " + changed_zoom_considerably);
    if (!moved_camera_considerably && !changed_zoom_considerably)
      return;

    previous_camera_position = cameraPosition;
    previous_delta = delta;

    //console.log("zoom: " + cameraPosition.zoom);
    console.log("delta: " + delta);

    if (delta <= 0.1)
      getOccurrencesWithinRectangle(cameraPosition.target.lng + delta, cameraPosition.target.lng - delta, cameraPosition.target.lat + delta, cameraPosition.target.lat - delta);
    else
      M.toast({html: 'Aumente o zoom para ver as occorrências de uma região.'});
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

  /*map.on(plugin.google.maps.event.CAMERA_MOVE_START, function(cameraPosition) {
    previous_camera_position = cameraPosition;
  });*/

  map.animateCamera({
    target: {lat:-22.9064, lng:-47.0616 },
    zoom: 13,
    //tilt: 1e-20,
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
