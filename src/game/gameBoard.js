'use strict'

const angle = 2 * Math.PI / 6; // 60 degrees
const radius = 50;

let ctx;
const directions = new Map();
directions.set(0/*'downRight'*/, {
  x: x + radius * (1 + Math.cos(angle)),
  y: y + radius * Math.sin(angle)
});
directions.set(1/*'down'*/, {
  x: x,
  y: y + 2 * radius * Math.sin(angle)
});
directions.set(2/*'downLeft'*/, {
  x: x - radius * (1 + Math.cos(angle)),
  y: y + radius * Math.sin(angle)
});
directions.set(3/*'upLeft'*/, {
  x: x - radius * (1 + Math.cos(angle)),
  y: y - radius * Math.sin(angle)
});
directions.set(4/*'up'*/, {
  x: x,
  y: y - 2 * radius * Math.sin(angle)
});
directions.set(5/*'upRight'*/, {
  x: x + radius * (1 + Math.cos(angle)),
  y: y - radius * Math.sin(angle)
});

function setContext(context) {
  ctx = context;
}

function stringify(obj) {
  return JSON.stringify(obj);
}

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

export default class GameBoard {
  constructor(context) {
    this.hexMap = new Map();
    setContext(context);
  }

  drawGrid = (width, height) => {
    for (let y = radius;
      y + radius * Math.sin(angle) < height;
      y += radius * Math.sin(angle)) {
      for (let x = radius, j = 0;
        x + radius * (1 + Math.cos(angle)) < width;
        x += radius * (1 + Math.cos(angle)), y += (-1) ** j++ * radius * Math.sin(angle)) {
        let coords = { x: x, y: y }
        drawHex(coords);
        let neighbors = findNeighbors(coords);
        this.set(coords, { tile: null, neighbors: neighbors });
      }
    }
  }

  findNeighbors = ({ x, y }, direction = null) => {
    let neighbors = [];
    for (let value of directions.values()) {
      if (value.x > 0 && value.x < canvas.width && value.y > 0 && value.y < canvas.height)
        neighbors.push(value);
    }
    if (direction === null) return neighbors;
    else return directions.get(direction);
  }

  set = (coordinates, data) => {
    if (typeof (coordinates) === 'string') {
      this.hexMap.set(coordinates, data);
    }
    else if (typeof (coordinates) === 'object') {
      let coords = stringify(coordinates);
      this.hexMap.set(coords, data);
    }
    else {
      console.error('Cannot set hex map data; invalid coordinate type')
    }
  }

  get = (coordinates) => {
    if (typeof (coordinates) === 'string') {
      return this.hexMap.get(coordinates);
    }
    else if (typeof (coordinates) === 'object') {
      let coords = stringify(coordinates);
      return this.hexMap.get(coords);
    }
    else {
      console.error('Cannot get hex map data; invalid coordinate type')
    }
  }

  has = (coordinates) => {
    if (typeof (coordinates) === 'string') {
      return this.hexMap.has(coordinates);
    }
    else if (typeof (coordinates) === 'object') {
      let coords = stringify(coordinates);
      return this.hexMap.has(coords);
    }
    else {
      console.error('Cannot peek hex map data; invalid coordinate type')
    }
  }
}
