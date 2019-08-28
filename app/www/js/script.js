function setVar (key, value) {
    window.localStorage.setItem(key, value);
  }
  document.addEventListener("deviceready", function() {
    if (cordova.platformId == 'android') {
      StatusBar.overlaysWebView(true);
      StatusBar.backgroundColorByHexString('#33000000');
    }
    $('#opcoes').sidenav({
      onOpenStart: () => {
      setVar('state','side_menu');
    }, onCloseEnd: () => {
      setVar('state','home');}});

    $('#filtros').modal({
      onOpenStart: () => {
      setVar('state','filtros');
    }, onCloseEnd: () => {
      setVar('state','home');}});
    
    $('#pesquisa-btn-container').click((e) => {
      $("#pesquisa-text-container").fadeIn(100);
      $("#pesquisa-text-container").css({width: (($(window).width()-40) + "px"),right:"20px"});
      $("#pesquisa-input").delay(500).fadeIn(100);
      $("#close-btn").delay(500).fadeIn(100);
      
      $("#menu-btn-container").fadeOut(200);
      $("#pesquisa-btn-container").css({display:"none"});
    }); //onclick="setVar('state','side_menu');"

    $('#close-btn').click((e) => {
      $("#search_places").val("");
      $("#search_places").focus();
    });

    document.addEventListener("backbutton", onBackKeyDown, false);

    function onBackKeyDown() {
      let page_state = window.localStorage.getItem("state");
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

    let div = document.getElementById("map_canvas");
    // Create a Google Maps native view under the map_canvas div.
    let map = plugin.google.maps.Map.getMap(div, {
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
    
    window.addEventListener('keyboardDidHide', () => {
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
        let place_to_go = $("#search_places").val();
        gotoPlace(place_to_go);
        Keyboard.hide();
        event.preventDefault();
      }
    });

    setVar("state","home");
    map.one(plugin.google.maps.event.MAP_READY, onMapInit);
  });

  function onMapInit (map) {
    map.animateCamera({
      target: {lat:-22.9064, lng:-47.0616 },
      zoom: 13,
      tilt: 30,
      bearing: 0,
      duration: 0
    }, function() {
    });
    /*map.getMyLocation((location) => {
      map.animateCamera({
        target: location.latLng,
        zoom: 13,
        tilt: 30,
        bearing: 0,
        duration: 1000
      }, function() {
      });
    }, () => {

    });*/

    function mapear (dir_json, dir_img) {
        $.getJSON( dir_json, function( data ) {
            var heatmapData = [];
            $.each( data, function(key,value) {
                if (value.LATITUDE != "") {
                    //MARKERS
                    /*map.addMarker({
                        position: {lat:parseFloat(value.LATITUDE.replace(",",".")), lng:parseFloat(value.LONGITUDE.replace(",","."))},
                        title: value.RUBRICA,
                        icon: {
                            url: dir_img,
                            size: {
                            width: 56,
                            height: 56
                            }
                        }
                    });*/

                    //HEATMAP
                    
                    /*map.addCircle({
                        center: {lat:parseFloat(value.LATITUDE.replace(",",".")), lng:parseFloat(value.LONGITUDE.replace(",","."))},
                        radius: 70,
                        fillColor: "rgba(255, 0, 0, 0.3)",
                        strokeColor: "rgba(255, 100, 0, 0.2)",
                        strokeWidth: 10
                    });*/
                    //console.log(value.LATITUDE.replace(",","."))
                    //console.log([parseFloat(value.LATITUDE.replace(",",".")), parseFloat(value.LONGITUDE.replace(",","."))])
                    heatmapData.push([parseFloat(value.LATITUDE.replace(",",".")), parseFloat(value.LONGITUDE.replace(",","."))]);
                    //console.log("Com coordenadas");
                    //console.log(value.LATITUDE + " " + value.LONGITUDE);
                }
                else
                {
                    console.log("Sem coordenadas");
                }

                /*if (value.UF != "" && value.BAIRRO != "" && value.NUMERO != "" && value.LOGRADOURO !="" && value.CIDADE != "") {
                    //let endereco = "Brasil, " + value.UF + ", " + value.CIDADE + ", " + value.BAIRRO + ", " + value.LOGRADOURO + ", " + value.NUMERO;
                    //alert(endereco);

                    

                    *//*nativegeocoder.forwardGeocode((coordinates) => {
                        let firstResult = coordinates[0];
                        map.addMarker({
                        position: {lat:firstResult.latitude, lng:firstResult.longitude},
                        title: value.RUBRICA,
                        icon: {
                            url: dir_img,
                            size: {
                                width: 56,
                                height: 56
                            }
                            }
                        });
                    }, (err) => {
                        console.log(err);
                    }, endereco, { });*//*
                }*/
            });

            console.log(heatmapData);
            map.addHeatmap({
              data: heatmapData
            });
            /*var heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map
            });*/

            //console.dir(map);
            //console.log(map.getMap());
            //console.log("test");
            //heatmap.setMap(map.getMap());
        });
    }

    //mapear("./occurrences/occurrences.json", "./icons/arma.png");
    //mapear("./occurrences/roubo_celular_2019_5.json");
    //mapear("./occurrences/occurrences_feminicidio.json");
    mapear("./occurrences/DadosBO_2019_7(ROUBO DE CELULAR).csv_unique.csv.json", "./icons/transparent_red_circle_2.png");
  }