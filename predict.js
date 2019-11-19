// ==UserScript==
// @name          Planets.nu addon mineral prediction
// @description   Predicts amount of minerals, mc, sup on a planet the following turn
// @include       http://planets.nu/home
// @include       http://planets.nu/games/*
// @include       http://*.planets.nu/*
// @include       http://planets.nu/*
// @version 1
// ==/UserScript==




function wrapper() { // wrapper for injection

  vgaPlanets.prototype.setupAddOn = function(addOnName) {
    if (vgaPlanets.prototype.addOns == null) vgaPlanets.prototype.addOns = {};
    vgaPlanets.prototype.addOns[addOnName] = {};
    var settings = localStorage.getItem(addOnName + ".settings");
    if (settings != null)
      vgaPlanets.prototype.addOns[addOnName].settings = JSON.parse(settings);
    else
      vgaPlanets.prototype.addOns[addOnName].settings = {};
    vgaPlanets.prototype.addOns[addOnName].saveSettings = function() {
      localStorage.setItem(addOnName + ".settings", JSON.stringify(vgaPlanets.prototype.addOns[addOnName].settings));
    }
    vgaPlanets.prototype.addOns[addOnName].current = {};
  };
  vgaPlanets.prototype.setupAddOn("Predict");

  // Set to -USERSCRIPT_ID to try and prevent note type collisions
  vgaPlanets.prototype.addOns.Predict.notetype = -1339190;

  // END Add-On Header

  // Note Storage/Retrieval functions
  /*  vgaPlanets.prototype.saveObjectAsNote = function(id, type, obj) {
      var note = this.getNote(id, type);
      if (note == null)
        note = this.addNote(id, type);
      note.changed = 1;
      note.body = JSON.stringify(obj);
    };

    vgaPlanets.prototype.getObjectFromNote = function(id, type) {
      var note = this.getNote(id, type);
      if (note != null && note.body != "")
        return JSON.parse(note.body);
      else
        return null;
    };
  */
  // End Note Storage/Retrieval functions


  if (false) {
    // MT deleted all stuff for nu version <3

  }



  /////////////////////////////////////////////////////////////////////////////////////
  else /*NEW VERSION*/ {
    /////////////////////////////////////////////////////////////////////////////////////

    /*
        vgapMap.prototype.noteColors = ["ff0000", "ff00ff", "ffffff", "0000ff", "00ff00", "00ffff", "ffff00", "ff6600", "ffccff", "669966", "666699"];

        vgapMap.prototype.chooseColor = function(index) {
          $(".NoteColor").removeClass("SelectedColor");
          if (index == -1) {
            $("#NColor").addClass("SelectedColor");
            vgap.selectedColor = "";
          } else {
            $("#NColor" + index).addClass("SelectedColor");
            vgap.selectedColor = this.noteColors[index];
          }
        };

    */

    vgaPlanets.prototype.addOns.Predict.showMinerals = function() {


    }


    var old_mousemove = vgapMap.prototype.mousemove;

    vgapMap.prototype.mousemove = function(e) {

      old_mousemove.apply(this, arguments);

      //console.log("Predict: mousemove:", e);
      let x = Math.round(vgap.map.mapX(e.clientX));
      let y = Math.round(vgap.map.mapY(e.clientY));

      //check if mouse pointer (hit) is over ship or planet
      let hit = null;
      if (x > 0 && x < 4000 && y > 0 && y < 4000)
        hit = vgap.map.checkForHit(x, y); // vgap.map.hitmap[x + "-" + y];
      if (hit !== null && hit.isPlanet) { // mouse over planet -> show ressources next turn
        //console.log("Predict: mouse near Planet:", hit);
        let prediction = [];
        let punload = []; // store prediction for transfer to allied bases => track unload FC problematic
        prediction['mc'] = 0;
        punload['mc'] = 0;
        prediction['sup'] = 0;
        punload['sup'] = 0;
        prediction['N'] = 0;
        punload['N'] = 0;
        prediction['T'] = 0;
        punload['T'] = 0;
        prediction['M'] = 0;
        punload['M'] = 0;
        prediction['D'] = 0;
        punload['D'] = 0;

        // handle bdm fcode part 1 - check ships in orbit of hit planet
        let orbships = vgap.shipsAt(hit.x, hit.y);
        if (orbships != null && orbships.length > 0) {
          for (let i = 0; i < orbships.length; i++) { // iteration through the shipMap
            //console.log("Length", orbships.length);
            //console.log("Orbships: ", orbships[i]);
            if (orbships[i].friendlycode != "" && orbships[i].friendlycode.toUpperCase() == "BDM") {
              prediction['mc'] += orbships[i].megacredits;
              punload['mc'] += orbships[i].megacredits;
            }
          }
        }

        let checkunload = false;
        //hit planet is allied base with unload freighter misson -> then check fecodes of planet and incoming ships!
        if (hit.mines != -1 && hit.isbase) { // hit.mines == -1 => unknown planet
          for (let i = 0; i < vgap.starbases.length; i++) {
            if (vgap.starbases[i].planetid == hit.id &&
              vgap.starbases[i].mission == 4 && hit.ownerid != vgap.player.id) { // misson 4 => unload all freighters and base is not own base
              //console.log("HIT has starbase and Starbasemission to 'unload'", hit.ownerid, vgap.race.id);
              checkunload = true;
              break;
            }
          }
        }

        let rel = getRelevantShips(hit);
        let relships = uniq(rel, compareFunc);
        //console.log("Relevant Ships: ", relships);


        //iterate through all incoming ships
        for (let i = 0; i < relships.length; i++) {
          //console.log("Predict: checking ships", vgap.myships[i]);
          //let pl = vgap.warpWell(relships[i].targetx, relships[i].targety);

          //begin ship prediction

          //if ((((relships[i].targetx == hit.x && relships[i].targety == hit.y) || (pl != null ? ((pl.x == hit.x && pl.y == hit.y) ? true : false) : false)) &&
          //    shipCanReachPlanet(relships[i]))) { //ship targeting planet and ship can reach planet or ship in orbit of hit and has fcode bdm
          //console.log("Predict: Ship heading to Planet:", vgap.myships[i].name, hit.name);

          // handle bdm fcodes part 2 ship over planet and fcode bdm
          if (relships[i].friendlycode.toUpperCase() == "BDM" && isShipOverPlanet(relships[i]) != null && !(isShipOverPlanet(relships[i]).id == hit.id)) {
            prediction['mc'] += 0; //mc won't land on target planet
            punload['mc'] += 0;
          } else {
            prediction['mc'] += relships[i].megacredits;
            checkunload && relships[i].friendlycode === hit.friendlycode ? punload['mc'] += relships[i].megacredits : null;
          }

          prediction['sup'] += relships[i].supplies;
          prediction['T'] += relships[i].tritanium;
          prediction['M'] += relships[i].molybdenum;
          prediction['D'] += relships[i].duranium;
          prediction['N'] += relships[i].neutronium;

          if (checkunload && relships[i].friendlycode === hit.friendlycode) {
            punload['sup'] += relships[i].supplies;
            punload['T'] += relships[i].tritanium;
            punload['M'] += relships[i].molybdenum;
            punload['D'] += relships[i].duranium;
            punload['N'] += relships[i].neutronium;
          }

          // check if ship is towed away from hit Planet
          let tower = vgap.isTowTarget(relships[i].id);
          let towaway = true;
          if (tower != null) { //relship is beeing towed away from hit planet and outside warpell of hit planet
            let towerTargetWarpwell = vgap.warpWell(tower.targetx, tower.targety);

            if (towerTargetWarpwell != null) { //ship is beeing towed to warpwell
              if (towerTargetWarpwell.x == hit.x && towerTargetWarpwell.y == hit.y) {
                towaway = false; //ship stays on hit planet
              }
            }
            if (towaway && tower.targetx != hit.x && tower.targety != hit.y) {

              prediction['sup'] -= relships[i].supplies;
              prediction['T'] -= relships[i].tritanium;
              prediction['M'] -= relships[i].molybdenum;
              prediction['D'] -= relships[i].duranium;
              prediction['N'] -= relships[i].neutronium;
              prediction['mc'] -= relships[i].megacredits;

              if (checkunload && relships[i].friendlycode === hit.friendlycode) {
                punload['sup'] -= relships[i].supplies;
                punload['T'] -= relships[i].tritanium;
                punload['M'] -= relships[i].molybdenum;
                punload['D'] -= relships[i].duranium;
                punload['N'] -= relships[i].neutronium;
                punload['mc'] -= relships[i].megacredits;
              }
            }
            //console.log("predict: ship towed away from HIT planet: ", relships[i].id);
          }





          //check if ship is cloned on a base
          var clone = null;
          if (hit.ownerid == relships[i].ownerid && relships[i].friendlycode.toLowerCase() == "cln" &&
            clone == null && relships[i].x == hit.x && relships[i].y == hit.y) { //clone handling for ships orbiting hit planet and not targeting hit planet
            //assumes ships are in id order
            var check = vgap.cloneCheck(relships[i]);
            if (check.success) {
              clone = check;
              console.log("Cloning ship: ", check.duranium.val, check.megacredits.val, relships[i].name);
              //subtract cloning expenses
              prediction['mc'] -= check.megacredits.val;
              prediction['T'] -= check.tritanium.val;
              prediction['M'] -= check.molybdenum.val;
              prediction['D'] -= check.duranium.val;

            } else if (!clone)
              clone = check;
          }


          //repair with supplies
          if (relships[i].damage > 0) {
            var rep = Math.floor(relships[i].supplies / 5);
            rep = Math.min(rep, relships[i].damage);
            prediction['sup'] -= rep * 5;
            checkunload && relships[i].friendlycode === hit.friendlycode ? prediction['sup'] -= rep * 5 : null;
          }



          //mkt
          if (relships[i].torps > 0 && relships[i].friendlycode.toUpperCase() == "MKT") {
            var cost = vgap.getTorpedo(relships[i].torpedoid).torpedocost;
            var mkt = Math.min(relships[i].duranium, relships[i].tritanium, relships[i].molybdenum, Math.floor((relships[i].megacredits) / cost));

            prediction['D'] -= mkt;
            prediction['T'] -= mkt;
            prediction['M'] -= mkt;
            prediction['mc'] -= mkt * cost;

            if (checkunload && relships[i].friendlycode === hit.friendlycode) {
              punload['D'] -= mkt;
              punload['T'] -= mkt;
              punload['M'] -= mkt;
              punload['mc'] -= mkt * cost;
            }



          }

          //build fighters
          var builtfighters = 0;

          var creditsorsupplies = "supplies";
          var cors = "sup;"
          if (!vgap.gameUsesSupplies()) {
            cargocost = 5;
            creditsorsupplies = "megacredits";
            cors = "mc"
          }

          if ((relships[i].friendlycode.toUpperCase() == "LFM") && relships[i].bays > 0 && vgap.player.raceid > 8 && relships[i].neutronium > 0) {
            //console.log("build fighters: " + relships[i][creditsorsupplies] );
            builtfighters = Math.min(
              Math.floor((relships[i].molybdenum) / 2),
              Math.floor((relships[i].tritanium) / 3),
              Math.floor((relships[i][creditsorsupplies]) / 5));
            if (builtfighters > 0) {
              prediction['M'] -= builtfighters * 2;
              prediction['T'] -= builtfighters * 3;
              prediction[cors] -= builtfighters * 5;

              //lfm 12. unload 44.
              //if (checkunload && relships[i].friendlycode === hit.friendlycode) {
              //  punload['M'] -= builtfighters * 2;
              //  punload['T'] -= builtfighters * 3;
              //  punload['sup'] -= builtfighters * 5;
              //}

            }
          }

          // LFM handling
          if (relships[i].bays > 0 && vgap.player.raceid > 8 && relships[i].neutronium > 0) {
            //  console.log("HANDLE LFM******************");
            //lfmHandling(relships[i]);
          }


          //alchemy
          if (relships[i].hullid == 105 && relships[i].friendlycode.toLowerCase() != "nal") {
            if (vgap.settings.fcodesextraalchemy && (relships[i].friendlycode.toLowerCase() == "nad" || relships[i].friendlycode.toLowerCase() == "nat" || relships[i].friendlycode.toLowerCase() == "nam")) {
              var alchemy = Math.floor((relships[i].supplies) / 6);
              prediction['sup'] -= 6 * alchemy;
              switch (relships[i].friendlycode.toLowerCase()) {
                case "nad":
                  prediction['M'] += alchemy;
                  prediction['T'] += alchemy;
                  break;
                case "nat":
                  prediction['D'] += alchemy;
                  prediction['M'] += alchemy;
                  break;
                case "nam":
                  prediction['D'] += alchemy;
                  prediction['T'] += alchemy;
                  break;
              }
            } else {
              var alchemy = Math.floor((relships[i].supplies) / 9);
              prediction['sup'] -= 9 * alchemy;
              switch (relships[i].friendlycode.toLowerCase()) {
                case "ald":
                  prediction['D'] += 3 * alchemy;
                  break;
                case "alt":
                  prediction['T'] += 3 * alchemy;
                  break;
                case "alm":
                  prediction['M'] += 3 * alchemy;
                  break;
                default:
                  prediction['D'] += alchemy;
                  prediction['T'] += alchemy;
                  prediction['M'] += alchemy;
                  break;
              }
            }
          }

          //        } //end ship prediction

        } // iterate over relvant incoming ships

        prediction['mc'] += hit.megacredits > 0 ? hit.megacredits : 0;
        prediction['sup'] += hit.supplies > 0 ? hit.supplies : 0;
        prediction['sup'] += hit.factories > 0 ? hit.factories : 0;

        if (checkunload) {
          punload['mc'] += hit.megacredits > 0 ? hit.megacredits : 0;
          punload['sup'] += hit.supplies > 0 ? hit.supplies : 0;
          punload['sup'] += hit.factories > 0 ? hit.factories : 0;
        }


        //copied from nu.js
        if (hit.nativeclans > 0 && hit.nativetype == 2) {
          prediction['sup'] += Math.min(Math.floor(hit.nativeclans / 100), hit.clans);
          checkunload ? punload['sup'] += Math.min(Math.floor(hit.nativeclans / 100), hit.clans) : null;
        }




        //console.log("Predict: planet tritanium: ", hit.tritanium, parseInt(vgap.miningText(hit, hit.tritanium, hit.densitytritanium, hit.mines).slice(2).slice(0, -1)));
        prediction['T'] += parseInt(vgap.miningText(hit, hit.groundtritanium, hit.densitytritanium, hit.mines).slice(2).slice(0, -1)) > 0 ?
          parseInt(vgap.miningText(hit, hit.groundtritanium, hit.densitytritanium, hit.mines).slice(2).slice(0, -1)) : 0;
        prediction['T'] += hit.tritanium > 0 ? hit.tritanium : 0;

        if (checkunload) {
          punload['T'] += parseInt(vgap.miningText(hit, hit.groundtritanium, hit.densitytritanium, hit.mines).slice(2).slice(0, -1)) > 0 ?
            parseInt(vgap.miningText(hit, hit.groundtritanium, hit.densitytritanium, hit.mines).slice(2).slice(0, -1)) : 0;
          punload['T'] += hit.tritanium > 0 ? hit.tritanium : 0;
        }

        //console.log("Predict: planet tritanium: ", prediction['T']);

        prediction['M'] += parseInt(vgap.miningText(hit, hit.groundmolybdenum, hit.densitymolybdenum, hit.mines).slice(2).slice(0, -1)) > 0 ?
          parseInt(vgap.miningText(hit, hit.groundmolybdenum, hit.densitymolybdenum, hit.mines).slice(2).slice(0, -1)) : 0;
        prediction['M'] += hit.molybdenum > 0 ? hit.molybdenum : 0;

        if (checkunload) {
          punload['M'] += parseInt(vgap.miningText(hit, hit.groundmolybdenum, hit.densitymolybdenum, hit.mines).slice(2).slice(0, -1)) > 0 ?
            parseInt(vgap.miningText(hit, hit.groundmolybdenum, hit.densitymolybdenum, hit.mines).slice(2).slice(0, -1)) : 0;
          punload['M'] += hit.molybdenum > 0 ? hit.molybdenum : 0;
        }




        prediction['D'] += parseInt(vgap.miningText(hit, hit.groundduranium, hit.densityduranium, hit.mines).slice(2).slice(0, -1)) > 0 ?
          parseInt(vgap.miningText(hit, hit.groundduranium, hit.densityduranium, hit.mines).slice(2).slice(0, -1)) : 0;
        prediction['D'] += hit.duranium > 0 ? hit.duranium : 0;
        //  console.log("Predict: Duranium", vgap.miningText(hit, hit.groundduranium, hit.densityduranium, hit.mines, false));

        if (checkunload) {
          punload['D'] += parseInt(vgap.miningText(hit, hit.groundduranium, hit.densityduranium, hit.mines).slice(2).slice(0, -1)) > 0 ?
            parseInt(vgap.miningText(hit, hit.groundduranium, hit.densityduranium, hit.mines).slice(2).slice(0, -1)) : 0;
          punload['D'] += hit.duranium > 0 ? hit.duranium : 0;
        }



        prediction['N'] += parseInt(vgap.miningText(hit, hit.groundneutronium, hit.densityneutronium, hit.mines).slice(2).slice(0, -1)) > 0 ?
          parseInt(vgap.miningText(hit, hit.groundneutronium, hit.densityneutronium, hit.mines).slice(2).slice(0, -1)) : 0;
        prediction['N'] += hit.neutronium > 0 ? hit.neutronium : 0;

        if (checkunload) {
          punload['N'] += parseInt(vgap.miningText(hit, hit.groundneutronium, hit.densityneutronium, hit.mines).slice(2).slice(0, -1)) > 0 ?
            parseInt(vgap.miningText(hit, hit.groundneutronium, hit.densityneutronium, hit.mines).slice(2).slice(0, -1)) : 0;
          punload['N'] += hit.neutronium > 0 ? hit.neutronium : 0;
        }

        //console.log("Predict: Ship heading to Planet:", hit.name, prediction);

        // taxaes
        prediction['mc'] += vgaPlanets.prototype.addOns.Predict.nativeTaxAmount(hit) + vgaPlanets.prototype.addOns.Predict.colonistTaxAmount(hit);
        checkunload ? punload['mc'] += vgaPlanets.prototype.addOns.Predict.nativeTaxAmount(hit) + vgaPlanets.prototype.addOns.Predict.colonistTaxAmount(hit) : null;

        // indicator if ressource next turn on planet allow builing starbase
        let base_alert = false;

        if (prediction['mc'] + prediction['sup'] >= 902 &&
          prediction['D'] >= 120 &&
          prediction['T'] >= 402 &&
          prediction['M'] >= 340) {
          base_alert = true;
        }





        let html = '<div id="ressourcePrediction">' + '<div class="ItemTitle">On Planet next turn</div>' +
          "<li class='pred_items'> mc: " + prediction['mc'] + punloadText(punload['mc'], checkunload) + "</li>" +
          "<li class='pred_items'> sup: " + prediction['sup'] + punloadText(punload['sup'], checkunload) + "</li>" +
          "<li class='pred_items'> fuel: " + prediction['N'] + punloadText(punload['N'], checkunload) + "</li>" +
          "<li class='pred_items'> D: " + prediction['D'] + punloadText(punload['D'], checkunload) + "</li>" +
          "<li class='pred_items'> T: " + prediction['T'] + punloadText(punload['T'], checkunload) + "</li>" +
          "<li class='pred_items'> M: " + prediction['M'] + punloadText(punload['M'], checkunload);
        html += base_alert ? "<span class='red'> BASE! </span>" : " " + "</li>";

        // claculate Ground combat rating
        let maxdposts = 0;
        let ground_defense_ratio = 0; // 1+(Planetary Defense Posts / 20)
        let attackrace = vgap.player.raceid;
        let defenserace = vgap.getPlayer(hit.ownerid).raceid;
        let attackratio = 0;
        let defenseratio = 0;


        if (hit.clans < 50) {
          maxdposts = hit.clans;
        } else {
          maxdposts = Math.trunc(50 + Math.sqrt(hit.clans - 50));
        }


        if (attackrace == 2) attackratio = 30; //Lizards
        else if (attackrace == 4) attackratio = 15; // Klingon
        else attackratio = 1;

        if (defenserace == 2) defenseratio = 15; // Lizards
        else if (defenserace == 4) defenseratio = 5; // Klingon
        else defenseratio = 1;

        ground_defense_ratio = hit.clans * defenseratio * (1 + maxdposts * 0.05);

        html += "<li class='pred_items'>MaxD: " + maxdposts + " GC:" + addCommas(ground_defense_ratio.toFixed(2)) + "</div>";
        html += "<li class='pred_items'>KillClans: <span class='red'>" + addCommas( (ground_defense_ratio / attackratio).toFixed(2)) + "</span></div>";

        //console.log ("Ground Combat: ", attackrace, defenserace, hit.clans, maxdposts, ground_defense_ratio);

        //check existance of prediction container prevents multiple appends
        //if ($('#ressourcePrediction').length <= 0) $('#SelectLocation').prepend(html);
        if ($('#ressourcePrediction').length <= 0) {
          //decide wether to put the prediction view on top or bottom of the SelectLocation div
          //if($('#SelectLocation > div.childpane').children().length > 9)
          $('#SelectLocation > div.childpane > #ScanTitle').after(html); // predict always on top
          //else   $('#SelectLocation').append(html);
          //console.log("Children: ", $('#SelectLocation > div.childpane').children().length);
        }



      }

    }


    //copied from nu.js and modified
    vgaPlanets.prototype.addOns.Predict.nativeTaxAmount = function(planet, possible) {

      //amorph none
      if (planet.nativetype == 5)
        return 0;

      //cyborg max 20%
      var nativetaxrate = planet.nativetaxrate;
      var player = vgap.getPlayer(planet.ownerid);
      if (player != null) {
        if (player.raceid == 6 && nativetaxrate > 20)
          nativetaxrate = 20;
      }

      var val = Math.round(nativetaxrate * planet.nativetaxvalue / 100 * planet.nativeclans / 1000);

      if (val > planet.clans && !possible)
        val = planet.clans;

      //player tax rate (fed bonus)
      var taxbonus = 1;
      if (vgap.advActive(2) || (planet.ownerid != vgap.player.id && player.raceid == 1))
        taxbonus = 2;
      val = val * taxbonus;

      //insectoid bonus
      if (planet.nativetype == 6)
        val = val * 2;

      if (val > 5000)
        val = 5000;

      return val;
    }

    //copied from nu.js and modified
    vgaPlanets.prototype.addOns.Predict.colonistTaxAmount = function(planet) {
      var colTax = Math.round(planet.colonisttaxrate * planet.clans / 1000);

      var player = vgap.getPlayer(planet.ownerid);
      //player tax rate (fed bonus)

      var taxbonus = 1;

      if (vgap.advActive(2) || (planet.ownerid != vgap.player.id && player.raceid == 1))
        taxbonus = 2;

      colTax = colTax * taxbonus;

      if (colTax > 5000)
        colTax = 5000;

      return colTax;
    }



    //helper functions


   //addCommas(1000)   => 1,000
    function addCommas(nStr) {
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }


    function lfmHandling(ship) {

      var result = {
        ammo: 0,
        supplies: 0,
        neutronium: 0,
        duranium: 0,
        tritanium: 0,
        molybdenum: 0,
        megacredits: 0,
        damage: 0,
        crew: 0,
        cargo: 0
      };

      if (ship.bays > 0 && vgap.player.raceid > 8 && ship.neutronium > 0) {
        var race = vgap.player.raceid;
        var loadedfighters = 0;
        //load
        if (planet != null && planet.ownerid == vgap.player.id && ship.friendlycode.toUpperCase() == "LFM") {
          loadedfighters = Math.min(Math.floor(planet.molybdenum / 2),
            Math.floor(planet.tritanium / 3),
            Math.floor(planet.supplies / 5),
            Math.floor((hull.cargo - vgap.shipScreen.getTotalCargo(ship) - result.cargo) / 10));
          console.log("lfmHandling: Total Ship Cargo" + vgap.shipScreen.getTotalCargo(ship));
          if (loadedfighters > 0) {
            result.molybdenum += loadedfighters * 2;
            result.tritanium += loadedfighters * 3;
            result.supplies += loadedfighters * 5;
          }
        }
        //build
        var builtfighters = 0;
        if ((ship.friendlycode.toUpperCase() == "LFM") || ((race == 9 || race == 11) && ship.mission == 8) || race == 10) {
          builtfighters = Math.min(Math.floor((ship.molybdenum + result.molybdenum) / 2),
            Math.floor((ship.tritanium + result.tritanium) / 3),
            Math.floor((ship.supplies + result.supplies) / 5));
          if (builtfighters > 0) {
            result.molybdenum -= builtfighters * 2;
            result.tritanium -= builtfighters * 3;
            result.supplies -= builtfighters * 5;
            result.ammo += builtfighters;
          }
        }
      }
    }






    function shipCanReachPlanet(ship) {

      let dist = Math.dist(ship.targetx, ship.targety, ship.scanx, ship.scany);
      let warpdist = ship.warp * ship.warp;

      if (ship.hullid == 44 || ship.hullid == 45 || ship.hullid == 46)
        warpdist *= 2;


      //hyp ships
      //console.log("check ship: ", ship);

      let pl = vgap.warpWell(ship.targetx, ship.targety);

      if (dist < warpdist + 2 || (vgap.isHyping(ship) && dist > 339 && dist < 361)) { //ship is fast enough or enters warpwell
        return true;
      } else return false;

    }

    function isShipOverPlanet(ship) {

      for (let index in vgap.planets) {
        if (ship.x == vgap.planets[index].x && ship.y == vgap.planets[index].y) return vgap.planets[index];
      }
      return null;
    }

    function punloadText(value, checkunload) {
      let result = "";
      if (checkunload) result = "<span class='unload'> >>> " + value + "</span>";
      return result;
    }


    function getRelevantShips(hit) { //calculate all ships that contribute to the prediction
      let result = [];
      //iterate through all ships
      for (let i in vgap.myships) {
        //console.log("Predict: checking ships", vgap.myships[i]);
        let pl = vgap.warpWell(vgap.myships[i].targetx, vgap.myships[i].targety);
        if ((((vgap.myships[i].targetx == hit.x && vgap.myships[i].targety == hit.y) || (pl != null ? ((pl.x == hit.x && pl.y == hit.y) ? true : false) : false)) &&
            shipCanReachPlanet(vgap.myships[i]))) { //ship targeting planet and ship can reach planet or ship in orbit of hit and has fcode bdm
          //console.log("Predict: Ship heading to Planet:", vgap.myships[i].name, hit.name);
          result.push(vgap.myships[i]);
          if (vgap.myships[i].mission == 6) { //ship tows another ship
            result.push(vgap.getShip(vgap.myships[i].mission1target));
          }
        }
        // ship is cloned and over hit planet
        if (vgap.myships[i].x == hit.x && vgap.myships[i].y == hit.y && vgap.myships[i].friendlycode.toLowerCase() == "cln") {
          result.push(vgap.myships[i]);
        }
      }
      return result;
    }


    function compareFunc(ship1, ship2) {
      //console.log("Comparing: ", ship1.id, ship2.id)
      return parseInt(ship1.id) - parseInt(ship2.id);
    }

    // Provide your own comparison
    function uniq(a, compareFunc) {
      a.sort(compareFunc);
      for (var i = 1; i < a.length;) {
        if (compareFunc(a[i - 1], a[i]) === 0) {
          a.splice(i, 1);
        } else {
          i++;
        }
      }
      return a;
    }


    /*
     *  Specify your plugin
     *  You need to have all those methods defined or errors will be thrown.
     *  I inserted the print-outs in order to demonstrate when each method is
     *  being called. Just comment them out once you know your way around.
     *
     *  For any access to plugin class variables and methods from inside these
     *  reserved methods, "vgap.plugins["nameOfMyPlugin"].my_variable" has to be
     *  used instead of "this.my_variable".
     */
    var plugin = {

      /*
       * processload: executed whenever a turn is loaded: either the current turn or
       * an older turn through time machine
       */
      processload: function() {
        //console.log("Predict: processload called");
        //var overlays = vgap.getObjectFromNote(0, vgap.addOns.vgapMapMarkUp.notetype);
        //if (overlays == null)
        //  overlays = [];
        //vgap.addOns.vgapMapMarkUp.overlays = overlays;
      },

      /*
       * loaddashboard: executed to rebuild the dashboard content after a turn is loaded
       */
      loaddashboard: function() {
        //console.log("Predict: loaddashboard called");
      },

      /*
       * showdashboard: executed when switching from starmap to dashboard
       */
      showdashboard: function() {
        //console.log("Predict: showdashboard called");
        //vgap.addOns.vgapMapMarkUp.resetDrawTools();
      },

      /*
       * showsummary: executed when returning to the main screen of the dashboard
       */
      showsummary: function() {
        //console.log("Predict: showsummary called");
      },

      /*
       * loadmap: executed after the first turn has been loaded to create the map
       * as far as I can tell not executed again when using time machine
       */
      loadmap: function() {
        //console.log("Predict: loadmap called");

        //if (this.overlays != null) this.overlays.remove();
        //vgap.map.overlays_canvas = document.createElement("canvas");
        // vgap.map.overlays = vgap.map.overlays_canvas.getContext("2d");
        if (!vgap.map.zoomlevels) vgap.map.zoomlevels = [
          0.2,
          0.6,
          1,
          1.5,
          2.3,
          3.4,
          5.1,
          7.6,
          11.4,
          17.1,
          25.7,
          38.5,
          57.8,
          86.7,
          130.1,
          195.1,
          292.6,
          438.9,
          658.3
        ];
        //vgap.map.drawOverlays();
        //vgap.map.addMapTool("Draw", "ShowMinerals", vgap.addOns.vgapMapMarkUp.showDrawTools);
        //vgap.map.addMapTool("Layers", "ShowMinerals", vgap.addOns.vgapMapMarkUp.showOverlayFilter);


      },

      /*
       * showmap: executed when switching from dashboard to starmap
       */
      showmap: function() {
        //console.log("Predict: showmap called");
        //vgap.addOns.vgapMapMarkUp.resetDrawTools();
      },

      /*
       * draw: executed on any click or drag on the starmap
       */
      draw: function() {
        //console.log("Predict: draw called");
        //vgap.map.overlays.width = vgap.map.canvas.width;
        //vgap.map.overlays.height = vgap.map.canvas.height;

        //vgap.map.overlays = vgap.map.canvas.getContext("2d");
        //vgap.map.drawOverlays();
      },

      /*
       * loadplanet: executed a planet is selected on dashboard or starmap
       * loadstarbase: executed a planet is selected on dashboard or starmap
       * Inside the function "load" of vgapPlanetScreen (vgapPlanetScreen.prototype.load) the normal planet screen
       * is set up. You can find the function in "nu.js" if you search for 'vgap.callPlugins("loadplanet");'.
       *
       * Things accessed inside this function several variables can be accessed. Elements accessed as "this.X"
       * can be accessed here as "vgap.planetScreen.X".
       */
      loadplanet: function() {
        //console.log("Predict: loadplanet called");
        //				console.log("LoadPlanet: plugin called.");
        //				console.log("Planet id: " + vgap.planetScreen.planet.id);
      },

      /*
       * loadstarbase: executed a planet is selected on dashboard or starmap
       * Inside the function "load" of vgapStarbaseScreen (vgapStarbaseScreen.prototype.load) the normal starbase screen
       * is set up. You can find the function in "nu.js" if you search for 'vgap.callPlugins("loadstarbase");'.
       *
       * Things accessed inside this function several variables can be accessed. Elements accessed as "this.X"
       * can be accessed here as "vgap.starbaseScreen.X".
       */
      loadstarbase: function() {
        //console.log("Predict: loadstarbase called");
        //				console.log("LoadStarbase: plugin called.");
        //				console.log("Starbase id: " + vgap.starbaseScreen.starbase.id + " on planet id: " + vgap.starbaseScreen.planet.id);
      },

      /*
       * loadship: executed a planet is selected on dashboard or starmap
       * Inside the function "load" of vgapShipScreen (vgapShipScreen.prototype.load) the normal ship screen
       * is set up. You can find the function in "nu.js" if you search for 'vgap.callPlugins("loadship");'.
       *
       * Things accessed inside this function several variables can be accessed. Elements accessed as "this.X"
       * can be accessed here as "vgap.shipScreen.X".
       */
      loadship: function() {
        //console.log("Predict: loadship called");
        //				console.log("LoadShip: plugin called.");
      },

      // END PLUGIN FUNCS

    };

    // register your plugin with NU
    vgap.registerPlugin(plugin, "Predict");
    console.log("Predict Plugin registered!");

  }


} //wrapper for injection

var script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";

document.body.appendChild(script);
document.body.removeChild(script);
