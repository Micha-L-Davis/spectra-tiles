'use strict'

import { randomIndex } from "../utilities";

let ctx;
function setContext(context) {
  ctx = context;
}

const rotationCooldown = 250;
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

export default class Tile {
  constructor(centerCoordinates, context) {
    //console.log(trigons)
    this.centerCoordinates = centerCoordinates;
    this.trigons = generateColorSet();
    this.isHeld = true;
    setContext(context);
  };

  rotate = (dir) => {
    let now = Date.now();
    if (now < this.nextRotationTime) return;

    if (dir === -1) {
      let first = this.trigons.shift();
      this.trigons.push(first);
    }
    if (dir === 1) {
      let last = this.trigons.pop();
      this.trigons.unshift(last);
    }
    //console.log(this.trigons);
    this.nextRotationTime = Date.now() + rotationCooldown;
    this.draw();
  };

  draw = (isPlacing = false) => {
    let { x, y } = this.centerCoordinates;
    let fillArray = this.trigons;
    let i = 0;
    for (let i = 0; i < 6; i++) {
      this.ctx.beginPath();
      this.ctx.lineTo(
        x + radius * Math.cos(angle * i),
        y + radius * Math.sin(angle * i)
      );
      this.ctx.lineTo(
        x + radius * Math.cos(angle * i + 1.04),
        y + radius * Math.sin(angle * i + 1.04)
      );
      this.ctx.lineTo(x, y);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.fillStyle = fillArray[i].color;
      this.ctx.fill();
    }

    if (isPlacing) {
      this.isHeld = false;
    }
  }
}

class Trigon {
  constructor(color) {
    this.color = color;
    this.isClosed = false;
    this.score = 0;
  }
}

function generateColorSet() {
  // let colorCount = randomIntExclusive(3) + 1;

  let mainColor = randomIndex(colors);
  let bannedColor = harmonics.get(mainColor).opposite;
  let filteredColors = filterColor(colors, mainColor);

  filteredColors = filterColor(filteredColors, bannedColor);
  let mainConfig = configureRegion(3);

  let regions = [];
  let mainRegion = {
    color: mainColor,
    size: mainConfig.size * 2,
    pattern: mainConfig.pattern
  }
  regions.push(mainRegion);

  if (/*colorCount > 1 &&*/ mainRegion.size === 6) {
    return colorSetToTrigonArray(regions);
  } else {
    let freeSpace = 6 - mainRegion.size;
    while (freeSpace /*&& regions.length < colorCount*/) {
      //console.log(freeSpace, filteredColors);
      let color = randomIndex(filteredColors);
      filteredColors = filterColor(filteredColors, color);
      let subConfig = configureRegion(freeSpace);

      regions.push({
        color: color,
        size: subConfig.size,
        pattern: subConfig.pattern
      });
      freeSpace -= subConfig.size;
    }
    return colorSetToTrigonArray(regions);
  }

  function filterColor(array, colorToRemove) {
    return array.filter(color => color !== colorToRemove);
  }

  function configureRegion(maxSize) {
    let patterns = ['split', 'clump', 'none'];
    return {
      size: randomIntExclusive(maxSize) + 1,
      pattern: randomIndex(patterns)
    }
  }
}

function colorSetToTrigonArray(colorSet) {
  let array = []
  let regions = [...colorSet];
  while (regions.length) {
    let region = regions.shift();
    processRegion(region);
  }

  return array;

  function processRegion(region) {
    //console.log("processing ", region)

    let color = region.color;
    let size = region.size;
    let pattern = region.pattern;

    if (array.length > 5) {
      console.warn('Tile array is full!');
      return;
    }
    switch (pattern) {
      case 'split':
        let first = Math.ceil(size / 2);
        let remaining = Math.floor(size / 2);
        while (first) {
          //console.log("adding trigon of ", color);
          array.push(new Trigon(color));
          first--;
        }

        let nextRegion = regions.shift();
        regions.unshift({ color: color, size: remaining, pattern: 'clump' });
        if (nextRegion) {
          regions.unshift(nextRegion);
        }
        break;
      case 'clump':
        let total = size;
        while (total) {
          array.push(new Trigon(color))
          total--;
        }
        break;
      case 'none':
        let rand = randomIntExclusive(size + 1)
        let rem = size - rand;

        while (rand) {
          array.push(new Trigon(color))
          rand--;
        }
        if (rem) {
          let next = regions.shift();
          regions.unshift({ color: color, size: rem, pattern: 'clump' });
          if (next) {
            regions.unshift(next);
          }
        }
        break;
    }
  }
}
