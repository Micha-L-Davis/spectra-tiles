'use strict';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const angle = 2 * Math.PI / 6; // 60 degrees
const radius = 50;
// const origin = {
//   x: canvas.width / 2,
//   y: canvas.height / 2
// }

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
const harmonics = new Map();
harmonics.set('red',
  {
    isPrimary: true,
    opposite: 'green',
    discordant: ['blue', 'yellow'],
    concordant: ['purple', 'orange']
  }
);
harmonics.set('orange',
  {
    isPrimary: false,
    opposite: 'blue',
    discordant: ['purple', 'green'],
    concordant: ['red', 'yellow']
  }
);
harmonics.set('yellow',
  {
    isPrimary: true,
    opposite: 'purple',
    discordant: ['red', 'blue'],
    concordant: ['orange', 'green']
  }
);
harmonics.set('green',
  {
    isPrimary: false,
    opposite: 'red',
    discordant: ['orange', 'purple'],
    concordant: ['yellow', 'blue']
  }
);
harmonics.set('blue',
  {
    isPrimary: true,
    opposite: 'orange',
    discordant: ['yellow', 'red'],
    concordant: ['green', 'purple']
  }
);
harmonics.set('purple',
  {
    isPrimary: false,
    opposite: 'yellow',
    discordant: ['green', 'orange'],
    concordant: ['blue', 'red']
  }
);

const gameBoard = new Map();
let mousePos = {};

function drawHex(centerCoordinates) {
  let { x, y } = centerCoordinates;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(
      x + radius * Math.cos(angle * i),
      y + radius * Math.sin(angle * i)
    );
  }
  ctx.closePath();
  ctx.stroke();
}

function drawGrid(width, height) {
  for (let y = radius;
    y + radius * Math.sin(angle) < height;
    y += radius * Math.sin(angle)) {
    for (let x = radius, j = 0;
      x + radius * (1 + Math.cos(angle)) < width;
      x += radius * (1 + Math.cos(angle)), y += (-1) ** j++ * radius * Math.sin(angle)) {
      let coords = { x: x, y: y }
      drawHex(coords);
      let neighbors = findNeighbors(coords);
      gameBoard.set(coords, { hasTile: false, neighbors: neighbors });
    }
  }
}

function drawTile(centerCoordinates, colorSet) {
  let { x, y } = centerCoordinates;
  let i = 0;
  console.log(colorSet);
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.lineTo(
      x + radius * Math.cos(angle * i),
      y + radius * Math.sin(angle * i)
    );
    ctx.lineTo(
      x + radius * Math.cos(angle * i + 1.04),
      y + radius * Math.sin(angle * i + 1.04)
    );
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
    let fill = randomIndex(colors);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function findNeighbors({ x, y }, direction = null) {
  const directions = new Map();
  directions.set('downRight', {
    x: x + radius * (1 + Math.cos(angle)),
    y: y + radius * Math.sin(angle)
  });
  directions.set('upRight', {
    x: x + radius * (1 + Math.cos(angle)),
    y: y - radius * Math.sin(angle)
  });
  directions.set('upLeft', {
    x: x - radius * (1 + Math.cos(angle)),
    y: y - radius * Math.sin(angle)
  });
  directions.set('downLeft', {
    x: x - radius * (1 + Math.cos(angle)),
    y: y + radius * Math.sin(angle)
  });
  directions.set('down', {
    x: x,
    y: y + 2 * radius * Math.sin(angle)
  });
  directions.set('up', {
    x: x,
    y: y - 2 * radius * Math.sin(angle)
  });

  let neighbors = [];
  for (let value of directions.values()) {
    if (value.x > 0 && value.x < canvas.width && value.y > 0 && value.y < canvas.height)
      neighbors.push(value);
  }
  if (direction) return directions.get(direction);
  else return neighbors;
}

function generateColorSet() {
  let colorCount = randomIntExclusive(3) + 1;

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

  if (/*colorCount > 1 &&*/ mainRegion.size < 6) {
    let freeSpace = 6 - mainRegion.size;
    while (freeSpace /*&& regions.length < colorCount*/) {
      console.log(freeSpace, filteredColors);
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
    return regions;
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

function findClosestHexCenter(coordinates) {
  let closestCenter = { x: Infinity, y: Infinity };

  for (let [cell] of gameBoard) {
    let distanceToClosest = getDistance(coordinates, closestCenter);
    let distanceToCurrentCenter = getDistance(coordinates, cell);

    if (distanceToCurrentCenter < distanceToClosest) {
      closestCenter = cell;
    }
  }
  if (gameBoard.get(closestCenter).hasTile) return null; // Already a piece here, do nothing

  gameBoard.set(closestCenter, { ...gameBoard.get(closestCenter), hasTile: true });
  return closestCenter;
}

function getDistance(start, end) {
  let xDiff = Math.abs(start.x - end.x);
  let yDiff = Math.abs(start.y - end.y);

  return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
}

function randomIndex(array) {
  let index = randomIntExclusive(array.length);
  return array[index];
}

const randomIntExclusive = (max) => Math.floor(Math.random() * max);

function handleMousePos(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  mousePos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function handleClick() {
  let center = findClosestHexCenter(mousePos);
  let colorSet = generateColorSet();
  console.log('Color set: ', colorSet)
  if (center) drawTile(center, colorSet);
}

function init() {
  drawGrid(canvas.width, canvas.height);

  canvas.addEventListener('mousemove', (event) => handleMousePos(canvas, event));
  canvas.addEventListener('click', handleClick)
}
init();
