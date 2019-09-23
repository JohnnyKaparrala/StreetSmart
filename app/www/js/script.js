/* globals MARKERS_STATE, HEATMAP_STATE, markers, markers_id, marker_cluster:writable, where_conditions, convert_date_format_to_sqlite, getOccurrencesWithinRectangle, map_heatmap_with_result_set, map_marker_with_result_set, map_state:writable, occurrences_within_view */

function setVar (key, value) {
  window.localStorage.setItem(key, value);
}

var map_global;

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
  
  $('.modal').modal();
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
  
  $('#pesquisa-btn-container').click(function(/*e*/) {
    $("#pesquisa-text-container").fadeIn(100);
    $("#pesquisa-text-container").css({width: (($(window).width()-40) + "px"),right:"20px"});
    $("#pesquisa-input").delay(500).fadeIn(100);
    $("#close-btn").delay(500).fadeIn(100);
    
    $("#menu-btn-container").fadeOut(200);
    $("#pesquisa-btn-container").css({display:"none"});
  });

  $('#close-btn').click(function(/*e*/) {
    $("#pesquisa-input").fadeOut(100);
    $("#close-btn").fadeOut(100);
    $("#pesquisa-text-container").css({width:"56px",right:"23px"});
    $("#pesquisa-text-container").fadeOut(100);

    $("#menu-btn-container").fadeIn(200);
    $("#pesquisa-btn-container").css({display:"block"});

    setVar("state","home");
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

      /*default :{
        
      }*/
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

function apply_filters (/*event*/) {
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
    var moved_camera_considerably = true;
    var changed_zoom_considerably = true;
    if (previous_camera_position)
    {
      var d_y = (previous_camera_position.target.lat - cameraPosition.target.lat);
      var d_x = (previous_camera_position.target.lng - cameraPosition.target.lng);
      var distance = Math.sqrt(d_x * d_x + d_y * d_y);
      
      moved_camera_considerably = ((distance/previous_delta) > dist);
    }
    if (previous_delta) {
      changed_zoom_considerably = ((delta/previous_delta - 1) > zoom_change);
    }

    if (!moved_camera_considerably && !changed_zoom_considerably)
      return;

    console.log("delta: " + delta);

    if (delta <= 0.1)
    {
      previous_camera_position = cameraPosition;
      previous_delta = delta;
      getOccurrencesWithinRectangle(cameraPosition.target.lng + delta, cameraPosition.target.lng - delta, cameraPosition.target.lat + delta, cameraPosition.target.lat - delta);
    }
    else
    {
      $('.toast').hide();
      M.toast({html: 'Aumente o zoom para ver as occorrências de uma região.'});
    }
  });

  map.setOptions({
    'gestures': {
      'tilt': false,
      'rotate': false
    },
    'preferences': {
      'zoom': {
        'minZoom': 11
      }
    }
  });

  map.animateCamera({
    target: {lat:-22.9064, lng:-47.0616 },
    zoom: 14,
    bearing: 0,
    duration: 0
  }, function() {
  });
  
  $("#rbtn-heatmap").on("click", function (/*event*/) {
    map_state = HEATMAP_STATE;
    if (marker_cluster != null) {
      marker_cluster.remove();
      marker_cluster = null;
    }
    markers.splice(0, markers.length);
    markers_id.clear();
    map_heatmap_with_result_set(occurrences_within_view);
  });
  $("#rbtn-marker").on("click", function (/*event*/) {
    map_state = MARKERS_STATE;
    map_global.clear();
    map_marker_with_result_set(occurrences_within_view);
  });
}
