import harmonics from './harmonics';
import { findOppositeTrigon } from '../utilities';

const closedRegions = new Map(); //Key: 'regionName' Value: [trigonObj, trigonObj, ...]
const openRegions = new Map(); //Key: 'regionName' Value: [trigonObj, trigonObj, ...]
const oppositionModifier = -2;
const discordanceModifier = -1
const concordanceModifier = 1;
const matchModifier = 2;

let score = 0;

export default function scoreGraph() {
  traverseHexes(lastTilePlayed.centerCoordinates, compareHarmonics);

  traverseHexes({ x: 50, y: 50 }, calculateRegions);

  checkForClosedRegions();

  score += scoreClosedRegions();
  console.log("Score = ", score);

  function traverseHexes(startCoords, workFunction) {
    const viewed = new Set();
    const queue = [startCoords];

    while (queue.length > 0) {
      console.log("queue ", queue)
      const coords = queue.shift();
      console.log("coords ", coords)
      const hex = gameBoard.get(coords);
      console.log("looking for a tile at coords ", hex)
      if (hex.tile) {
        console.log("performing work on ", hex.tile);
        workFunction(hex.tile);
      }


      const neighbors = findNeighbors(hex);
      for (let neighbor of neighbors) {
        if (!viewed.has(gameBoard.get(neighbor))) {
          viewed.add(gameBoard.get(neighbor));
          queue.push(gameBoard.get(neighbor));
        }
      }
    }
  }

  function compareHarmonics(tile) {
    console.log("Comparing Harmonics of tile at ", tile.centerCoordinates)
    for (let i = 0; i < tile.trigons.length; i++) {
      console.log("checking trigon ", i, tile.trigons[i])
      let trigon = tile.trigons[i];
      if (trigon.isClosed)
        continue;

      let adjacentHexCoords = findNeighbors(tile.centerCoordinates, i);
      let adjacentHex = gameBoard.get(adjacentHexCoords);
      console.log("adjacent hex ", adjacentHexCoords, adjacentHex)
      if (!adjacentHex.tile)
        continue;

      let adjacentTrigon = adjacentHex.tile.trigons(findOppositeTrigon(i));
      scoreTrigons(trigon, adjacentTrigon);
      trigon.isClosed = true;
      adjacentTrigon.isClosed = true;
    }

    function scoreTrigons(trigonA, trigonB) {
      let harmonic = harmonics.get(trigonA.color);
      if (harmonic.opposite === trigonB.color) {
        trigonA.score += oppositionModifier;
        trigonB.score += oppositionModifier;
      }

      if (harmonic.discordant.includes(trigonB.color)) {
        trigonA.score += discordanceModifier;
        trigonB.score += discordanceModifier;
      }

      if (harmonic.concordant.includes(trigonB.color)) {
        trigonA.score += concordanceModifier;
        trigonB.score += concordanceModifier;
      }
      console.log("scores resolved: ", trigonA, trigonB)
    }
  }

  function calculateRegions(tile) {
    // first loop through tile and group adjacent trigons
    let tileRegions = new Set();
    for (let i = 0; i < tile.trigons.length; i++) {
      let trigon = tile.trigons[i];
      let nextIndex = i + 1
      if (nextIndex > 5) {
        nextIndex = nextIndex - 6;
      }
      let nextTrigon = tile.trigons[nextIndex];

      evaluateTrigonRegions(nextTrigon, trigon);
    }

    //then loop through adjacent trigons in neighboring tiles
    for (let region of tileRegions.values) {
      for (let trigons of openRegions(region)) {
        for (let i = 0; i < trigons.length; i++) {
          let trigon = trigons[i];
          let [adjacentHexCoords] = findNeighbors(tile.centerCoordinates, i);
          let adjacentHex = gameBoard.get(adjacentHexCoords);
          if (!adjacentHex.tile)
            return;

          let adjacentTrigon = adjacentHex.tile.trigons(findOppositeTrigon(i));
          evaluateTrigonRegions(trigon, adjacentTrigon);
        }
      }
    }

    function evaluateTrigonRegions(nextTrigon, trigon) {
      if (nextTrigon.color === trigon.color) {
        if (nextTrigon.region && trigon.region) {
          mergeRegions(trigon.region, nextTrigon.region);
          tileRegions.delete(nextTrigon.region);
          tileRegions.add(trigon.region);
        } else if (!nextTrigon.region && trigon.region) {
          nextTrigon.region = trigon.region;
          openRegions.set(trigon.region, [...openRegions.get(trigon.region), nextTrigon]);
        } else {
          let newRegion = generateRegionName(trigon.color);
          openRegions.set(newRegion, [trigon, nextTrigon]);
          tileRegions.add(newRegion);
        }
      }

      function mergeRegions(regionA, regionB) {
        openRegions.set(regionA, [...openRegions.get(regionA), ...openRegions.get(regionB)]);
        openRegions.delete(regionB);
      }

      function generateRegionName(color) {
        let newName = color + Math.floor(100000 + Math.random() * 900000).toString();
        while (openRegions.has(newName) || closedRegions.has(newName)) {
          newName = color + Math.floor(100000 + Math.random() * 900000).toString();
        }
        return newName;
      }
    }
  }

  function checkForClosedRegions() {
    for (let [region, trigons] of openRegions.entries()) {
      openTrigons = trigons.filter(trigon => !trigon.isClosed)
      if (!openTrigons) {
        closedRegions.set(region, trigons);
        openRegions.delete(region);
      }
    }
  }

  function scoreClosedRegions() {
    //reduce eached closed region to a region score
    let sum = 0;
    for (let trigons of closedRegions.values()) {
      sum += trigons.reduce((total, trigon) => total += trigon.score, 0);
    }
    //return sum of region scores
    return sum;
  }
}
