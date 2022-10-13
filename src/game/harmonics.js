'use strict'

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

export default harmonics; 
