function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;
var db;

document.addEventListener("deviceready", function() {
  $('.datepicker').datepicker({
    i18n: {
      months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      weekdays: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sabádo'],
      weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      weekdaysAbbrev: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
      today: 'Hoje',
      clear: 'Limpar',
      cancel: 'Sair',
      done: 'Confirmar',
      labelMonthNext: 'Próximo mês',
      labelMonthPrev: 'Mês anterior',
      labelMonthSelect: 'Selecione um mês',
      labelYearSelect: 'Selecione um ano',
      selectMonths: true,
      selectYears: 15,
    },
    format: "dd/mm/yyyy"
  });

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

  $('#aplicar-filtros-btn').click(apply_filters);

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

function apply_filters (event) {
  // TODO Finish
  where_conditions.splice(0,where_conditions.length); // clear the array
  var period_from_str = $("#period-start-date-datepicker").val();
  var period_until_str = $("#period-end-date-datepicker").val();

  var occurrences_types = [];
  $("[name='times-filter'][type=checkbox]:checked").each(function (index, checkbox){ occurrences_types.push(checkbox.value); });

  if (occurrences_types.length > 0 && occurrences_types.length < 5) {
    var occurrences_types_condition = "(OCCURRENCES.PERIOD = '" + occurrences_types[0] + "'";
    
    for (var i = 1; i < occurrences_types.length; i++) {
      occurrences_types_condition += "OR OCCURRENCES.PERIOD = '" + occurrences_types[i] + "'";
    }

    occurrences_types_condition += ")";
    where_conditions.push(occurrences_types_condition);
  }

  if (period_from_str != "" && period_until_str != "") {
    period_from_str = convert_date_format_to_sqlite(period_from_str);
    period_until_str = convert_date_format_to_sqlite(period_until_str);

    if (period_from_str < period_until_str)
      where_conditions.push("OCCURRENCES.DATE BETWEEN '" + period_from_str + "' AND '" + period_until_str + "'");
    else
      M.toast({html: 'Data de início deve ser anterior à data de fim. Desconsiderando o período especificado.'});
  }

  refresh_map_occurrences();
}

var window_min_length = Math.min(screen.height, screen.width)/100; //TODO Use phone's dpi
var markers_icon_size = 10.833333333333334 * window_min_length;
var markers_icon_anchor = {x: 23,y: 46};

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

var delta_function = function (zoom) {
  return 353.306270268435128 * Math.exp(-0.676030142340657 * zoom);
}

var previous_camera_position;
var previous_delta;
var dist = 0.6;
var zoom_change = 0.21;

function refresh_map_occurrences() {
  getOccurrencesWithinRectangle(previous_camera_position.target.lng + previous_delta, previous_camera_position.target.lng - previous_delta,
    previous_camera_position.target.lat + previous_delta, previous_camera_position.target.lat - previous_delta);
}

function onMapInit (map) {
  map.on(plugin.google.maps.event.CAMERA_MOVE_END, function(cameraPosition) {
    var delta = delta_function(cameraPosition.zoom);

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

    var moved_camera_considerably = true;
    var changed_zoom_considerably = true;
    if (previous_camera_position)
    {
      var d_y = (previous_camera_position.target.lat - cameraPosition.target.lat);
      var d_x = (previous_camera_position.target.lng - cameraPosition.target.lng);
      var distance = Math.sqrt(d_x * d_x + d_y * d_y);

      //console.log("distance/delta: " + (distance/delta));
      
      moved_camera_considerably = ((distance/previous_delta) > dist);
    }
    if (previous_delta) {
      //console.log("delta difference: " + (Math.abs(delta - previous_delta)));
      //(delta - previous_delta)/previous_delta = delta/previous_delta - 1
      changed_zoom_considerably = ((delta/previous_delta - 1) > zoom_change);
    }

    //console.log("moved_camera_considerably: " + moved_camera_considerably + "; changed_zoom_considerably: " + changed_zoom_considerably);
    if (!moved_camera_considerably && !changed_zoom_considerably)
      return;

    //console.log("zoom: " + cameraPosition.zoom);
    console.log("delta: " + delta);

    if (delta <= 0.1)
    {
      previous_camera_position = cameraPosition;
      previous_delta = delta;
      getOccurrencesWithinRectangle(cameraPosition.target.lng + delta, cameraPosition.target.lng - delta, cameraPosition.target.lat + delta, cameraPosition.target.lat - delta);
    }
    else
    {
      M.toast({html: 'Aumente o zoom para ver as occorrências de uma região.'});
    }
  });

  map.animateCamera({
    target: {lat:-22.9064, lng:-47.0616 },
    zoom: 14,
    //tilt: 1e-20,
    bearing: 0,
    duration: 0
  }, function() {
  });
  /*map.getMyLocation(function(location) {
    console.log(location);
    map.animateCamera({
      target: location.latLng,
      zoom: 14,
      //tilt: 1e-20,
      bearing: 0,
      duration: 1000
    }, function() {
    });
  }, function() {
    console.log("error");
  });*/
}
