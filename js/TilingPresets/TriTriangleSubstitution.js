// This code is part of JS-Sandpile (https://github.com/huacayacauh/JS-Sandpile/)
// CC-BY Valentin Darrigo, Jeremy Fersula, Kevin Perrot

// TriTriangle
// substitution described at
// https://tilings.math.uni-bielefeld.de/substitution/tritriangle/
// https://sites.math.washington.edu/wxml/tilings/pdfs/TriTriangle-tiling.pdf

//
// [1] define tile types TT
//

function pushVector(array, vector) {
  array.push(vector.x, vector.y);
}

function triangleVectorsToBounds(v1, v2, v3) {
  var bounds = [];
  pushVector(bounds, v1);
  pushVector(bounds, v2);
  pushVector(bounds, v3);
  return bounds;
}

function getTriBounds(size) {
  var bounds = [];
  bounds.push(-size/2, -size/4);
  bounds.push(size/2, -size/4);
  bounds.push(size/2, size*3/4);
  return bounds;
}
var triA0 = new Tile(["triangle0"], [], getTriBounds(1), 3);

Tile.prototype.tri0to1 = function() {
  this.id[0] = "triangle1";
};
Tile.prototype.tri1to2 = function() {
  this.id[0] = "triangle2";
};
Tile.prototype.tri2to0 = function() {
  this.id[0] = "triangle0";
};

//
// [2] define substitution TT
//

function substitutionTT(tile) {
  switch (tile.id[0]) {
    case "triangle0":
      var newtiles = [];
      
      var new_tri1 = tile.myclone();
      new_tri1.tri0to1();
      new_tri1.id.push("fils_0to1");
      newtiles.push(new_tri1);
      
      return newtiles;
    case "triangle1":
      var newtiles = [];
      
      var new_tri2 = tile.myclone();
      new_tri2.tri1to2();
      new_tri2.id.push("fils_1to2");
      newtiles.push(new_tri2);
      
      return newtiles;
    case "triangle2":
      var newtiles = [];
      
      var A = new THREE.Vector2(tile.bounds[0], tile.bounds[1]);
      var B = new THREE.Vector2(tile.bounds[2], tile.bounds[3]);
      var C = new THREE.Vector2(tile.bounds[4], tile.bounds[5]);
      var AB_center = ((new THREE.Vector2()).addVectors(A, B)).divideScalar(2);
      var AC_center = ((new THREE.Vector2()).addVectors(A, C)).divideScalar(2);
      var BC_center = ((new THREE.Vector2()).addVectors(B, C)).divideScalar(2);
      var AC_quarter = ((((new THREE.Vector2()).add(A)).multiplyScalar(3)).add(C)).divideScalar(4);
      var ABC_center = ((new THREE.Vector2()).addVectors(AC_center, B)).divideScalar(2);
      
      var new_tri2 = tile.myclone();
      new_tri2.bounds = triangleVectorsToBounds(C, AC_center, B);
      new_tri2.id.push("fils0");
      newtiles.push(new_tri2);
      
      var new_tri0_0 = tile.myclone();
      new_tri0_0.tri2to0();
      new_tri0_0.id.push("fils1");
      new_tri0_0.bounds = triangleVectorsToBounds(AB_center, AC_quarter, A);
      newtiles.push(new_tri0_0);

      var new_tri0_1 = tile.myclone();
      new_tri0_1.tri2to0();
      new_tri0_1.id.push("fils2");
      new_tri0_1.bounds = triangleVectorsToBounds(B, ABC_center, AB_center);
      newtiles.push(new_tri0_1);
      
      var new_tri0_2 = tile.myclone();
      new_tri0_2.tri2to0();
      new_tri0_2.id.push("fils3");
      new_tri0_2.bounds = triangleVectorsToBounds(AC_center, AC_quarter, AB_center);
      newtiles.push(new_tri0_2);
      
      var new_tri0_3 = tile.myclone();
      new_tri0_3.tri2to0();
      new_tri0_3.id.push("fils4");
      new_tri0_3.bounds = triangleVectorsToBounds(AC_center, ABC_center, AB_center);
      newtiles.push(new_tri0_3);
      
      return newtiles;
    default:
      console.log("caution: undefined tile type for substitutionTT, id = " + tile.id);
  }
}

//
// [3] no duplicated tiles
// [4] I am lazy
//

//
// [6] use default neighbors2bounds
//

var neighbors2boundsTT = new Map();
neighbors2boundsTT.set("triangle0", default_neighbors2bounds(3));
neighbors2boundsTT.set("triangle1", default_neighbors2bounds(3));
neighbors2boundsTT.set("triangle2", default_neighbors2bounds(3));

//
// [7] construct base tilings and call substitute
//

// prepare decoration
var decorateTT = new Map();
decorateTT.set("triangle0", 4);
decorateTT.set("triangle1", 1);
decorateTT.set("triangle2", 0);

Tiling.TriTriangleBySubst = function({iterations}={}) {
  var tiles = [];
  var my_tri = triA0.myclone();
  tiles.push(my_tri);
  tiles = substituteTriTriangle(
    iterations,
    tiles,
    Math.sqrt(2),
    substitutionTT,
    [], // no duplicated tiles
    [], // no duplicated tiles
    "laziness", // myneighbors
    neighbors2boundsTT,
    decorateTT
  );
  return new Tiling(tiles);
};


function substituteTriTriangle(iterations,tiles,ratio,mysubstitution,mydupinfos,mydupinfosoriented,myneighbors,findNeighbors_option=false,mydecoration_option=false){
  // lazy? discover base neighbors
  if(typeof(myneighbors)=="string"){
    // check that findNeighbors_option is set
    if(findNeighbors_option==false){
      console.log("error: please provide some neighbors2bounds according to your dupinfos/dupinfosoriented, even if you are lazy.");
      return tiles;
    }
    console.log("lazy: compute base neighbors");
    // reset then find neighbors
    resetAllNeighbors(tiles);
    let tilesdict = new Map(tiles.map(i => [id2key(i.id), i]));
    let fn=findNeighborsEnhanced(tiles,tilesdict,findNeighbors_option);
    console.log("  found "+fn);
  }
  // scale the base tiling all at once
  tiles.forEach(tile => tile.scale(0,0,ratio**iterations));
  // iterate substitution
  for(let i=0; i < iterations; i++){
    console.log("starting substitution "+(i+1)+"/"+iterations+"...");
    // substitute (scaling already done)
    console.log("* create (new) tiles");
    let newtiles = tiles.flatMap(mysubstitution);
    console.log("  "+newtiles.length+" tiles");
    // convert tiles array to map with id as key (for convenient access)
    let tilesdict = new Map(tiles.map(i => [id2key(i.id), i]));
    // convert newtiles array to map with id as key (for convenient access)
    let newtilesdict = new Map(newtiles.map(i => [id2key(i.id), i]));
    // compute map of duplicated newtiles (idkey -> id)
    console.log("* compute map of duplicated tiles");
    let newdup = duplicatedMap(mydupinfos,mydupinfosoriented,tiles,tilesdict);
    // set neighbors (if user is not lazy)
    if(typeof(myneighbors)!="string"){
      console.log("* compute neighbors (local)");
      myneighbors(tiles,tilesdict,newtiles,newtilesdict,newdup);
    }
    else{
      console.log("* lazy: reset neighbors");
      resetAllNeighbors(newtiles);
    }
    // remove duplicated tiles
    console.log("* clean duplicated tiles");
    newtiles = clean(newtiles,newdup);
    // find neighbors from non-adjacent tiles
    if(findNeighbors_option != false){
      console.log("* compute neighbors (global)");
      let fn=findNeighborsEnhanced(newtiles,newtilesdict,findNeighbors_option);
      console.log("  found "+fn);
    }
    // update tiles
    tiles = newtiles;
      console.log("* done");
  }
  // decorate tiles
  if(mydecoration_option != false){
    console.log("decorate tiles");
    tiles.forEach(tile => tile.sand=mydecoration_option.get(tile.id[0]));
  }
  // done
  console.log(tiles);
  console.log("done");
  return tiles;
}
