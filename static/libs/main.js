/*global $t */

"use strict";

function diceInitialize(container, w, h) {
    function onSetChange(/*ev*/) {
        set.style.width = set.value.length + 3 + 'ex';
    }

    $t.remove($t.id('loading_text'));

    var canvas = $t.id('canvas');
    canvas.style.width = '92vw';
    canvas.style.height = '85vh';
    canvas.style.display = 'inline-block';
    var label = $t.id('label');
    var set = $t.id('set');
    var selectorDiv = $t.id('selector_div');
    var infoDiv = $t.id('info_div');
    var townProp = $t.id('town_properties');

    var house_prop_body_id = $t.id('house_props_body');
    var house_prop_header_id = $t.id('house_props_header');
    var house_prop_id = $t.id('house_props');

    onSetChange();

    var dice_results = {}

    $t.bind(set, 'keyup', onSetChange);
    $t.bind(set, 'mousedown', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'mouseup', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'focus', function() { $t.set(container, { class: '' }); });
    $t.bind(set, 'blur', function() { $t.set(container, { class: 'svg' }); });

    $t.bind($t.id('clear'), ['mouseup', 'touchend', 'touchcancel'], function(ev) {
        ev.stopPropagation();
        set.value = '0';
        onSetChange();
    });

    var box = new $t.dice.dieBox(canvas);

    function getRandom(min,max) {
	return Math.floor(Math.random() * (max - min)) + min;
    }

    function beforeRoll(/*vectors*/) {

    }

    ///the dice roll function requires an after roll to send results. Use a callback in dice.js line 477 to receive a json object of results sorted by diceType.
    function afterRoll(notation, result) {
	town_name.innerHTML = json.town_name;
        infoDiv.style.display = 'block';

        //for each set of d6 roll against the common_curiousities table
	var d6_common = [];

	//add the die_result to the houses object
	for (var i =0; i < json.houses.length; i++){
		json.houses[i]["dice_face"] = result.diceType.d6[i];
	}
	for (var i= 0; i < 6; i++){
		var diceTotal = 0;
		var d6_common_houseNumbers = [];


		result.diceType.d6.forEach(function(result) {
                	diceTotal += result == i+1 ? getRandom(1,6) : 0;
		});

		if (diceTotal != 0){
			 d6_common[i] = { "response_text" : (diceTotal >= 30 ? tables.common_curiousity[29].response 
							  : tables.common_curiousity[diceTotal-1].response),
					  "house_numbers" : d6_common_houseNumbers};
		}

	}


	//for each of the d12 dice that resulted look up the response in the d12 table
	var d12_features =[];
	result.diceType.d12.forEach(function(result, callback) {
		d12_features.push(tables.d12_table[result-1].response);
	});

	//for each the d4 dice, look up the resulting table and random a response from it.
	var d4_feature = tables.d4_table[result.diceType.d4[0]][getRandom(0,3)].response;

	//who is in charge here?
	var leader = tables.leader[getRandom(0,9)].result;

	//append the factions
	/*var factions = '<span id="factions"><h6>What Kind of People Live Here?</h6>';
        for (var i = 0; i < 6; i++){
                if (d6_common[i]) factions += '<li><em>Dice with a ' +(i+1)+'</em> ' + d6_common[i].response_text + '</li>';
        }
	$(".town_prop").append(factions+'</span>');*/

	//append the leader property
	$(".town_prop").append('<span id="leader"><h6>'+ leader +' leads this village. </h6>');


	dice_results['d6_results'] = d6_common;
	dice_results['d12_features'] = d12_features;
	dice_results['d4_feature'] = d4_feature;


	if (infoDiv.clientHeight < townProp.clientHeight) infoDiv.style.height = "100%";

    }

    if (box.rolling) {
            return;
    }
//    ev.stopPropagation();
    var coords = {x: (box.rnd() * 2 - 1) * box.w,
                  y: -(box.rnd() * 2 - 1) * box.h};
    var dist = Math.sqrt(coords.x * coords.x + coords.y * coords.y);
    var boost = (box.rnd() + 3) * dist;
    coords.x /= dist; coords.y /= dist;

//grab the diceSpec
    var json = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': '/dice/results',
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
    })();

    var dieSpec = JSON.stringify(json);
    var dieSet = JSON.parse(dieSpec);
    if (dieSet.set.length === 0) {
            return;
    }

//grab the tables
    var tables = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': '/tables',
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
    })();

//number of houses
    var numberOfFeatures = json.set.length - json.houses.length;

    box.rollDice(dieSet, coords, boost, beforeRoll, afterRoll);

    function format_house_props(tooltip_header, tooltip_body, header_color){
       var house_prop_header = "<span id ='house_number'>" + tooltip_header  + "</span>";
       var house_prop_body = tooltip_body;

        house_prop_header_id.innerHTML = house_prop_header;
        house_prop_body_id.innerHTML = house_prop_body;

        house_prop_header_id.style.backgroundColor = header_color;

    }


    $t.bind(container, ['mouseup', 'touchend', 'touchcancel', 'mousemove'], function(ev) {
        var dieProps = box.searchDieByMouse(ev);

	var house_prop_header;
	var house_prop_body;

        //find the last object baned ArrowHelper to remove it.
        if ( box.scene.getObjectByName("ArrowHelper") ) box.scene.remove( box.scene.getObjectByName("ArrowHelper") );



        if (dieProps !== undefined) {
	    house_prop_id.style.display = 'table';

	    //Format  the tooltip based on the properties of the dice.
	    switch (dieProps.type){
	    	case 'd12':
			var house_prop = dice_results['d12_features'][dieProps.houseNumber-1];
			format_house_props("Point of Interest","<p style='font-size: 100%;'>" + house_prop + "</p>", 'rgba(131, 0, 255, 0.70)');
			break;
	        case 'd4':
			var house_prop = dice_results['d4_feature'];
			format_house_props("Significant Feature","<p style='font-size: 100%;'>" + house_prop + "</p>", 'rgba(173,0,0,0.70)');
			break;
		default:

			 var house_prop  = json.houses[dieProps.houseNumber - numberOfFeatures];
			 format_house_props("<span id ='house_number'><h6>House Number " + (house_prop.id+1) + "</h6></span>",
			 		        "<span id ='inhabitant' class='house_prop'><em>Inhabitant: </em>" + house_prop.inhabitant + "</span>" +
				  		"<span id ='relationship' class='house_prop'><em>Relationship: </em> " + house_prop.relationship +
        			  	     " to house number " + (house_prop.to+1) + "</span>" +
					     "<span id='faction' class='house_prop'><em>Interesting Fact: </em> " + dice_results['d6_results'][house_prop.dice_face  -1].response_text + "</span>",
					     'rgba(67, 67, 67, 0.85)');


			//Draw an arrow from the current house to the house it has a relationship

			  //search for the remote house number. Add the number of features because the backend and front end have different house numbers
			  var houseSearch = box.searchByHouseNumber((house_prop.to + numberOfFeatures));
			  // because searchByHouseNumber returns a pointer
                          var current_house = new THREE.Vector3(dieProps.x, dieProps.y, dieProps.z + 100);
                          var to_house = new THREE.Vector3 (houseSearch.x, houseSearch.y, houseSearch.z);
			  var direction = to_house.clone().sub(current_house);
			  var length = direction.length();

			  var arrowHelper = new THREE.ArrowHelper(direction.normalize(), current_house, length, 0x2CAEBE);
			  arrowHelper.name = "ArrowHelper";

			  //add the arrow helper which should be at the current house position
			  box.scene.add( arrowHelper );
			  box.renderer.render(box.scene,box.camera);

           }

	   house_prop_id.style.marginTop =  (ev.clientY - house_prop_id.offsetHeight) < canvas.getBoundingClientRect().top  ?
					      ev.clientY + 'px':
					      (ev.clientY - house_prop_id.offsetHeight) + 'px';

	   house_prop_id.style.marginLeft = (ev.clientX - house_prop_id.offsetWidth) <  canvas.getBoundingClientRect().left ?
						ev.clientX + 'px' :
						(ev.clientX - house_prop_id.offsetWidth) + 'px';
        }
	else{
	    house_prop_id.style.display = 'none';
        }
	//add the arrow helper which should be at the current house position
        box.renderer.render(box.scene,box.camera);

   });
}
