import { times } from 'lodash';
import ship from './ship';
import bullets from './bullets';
import asteroids from './asteroids';
import debris from './debris';
import { MOVE } from '../actionCreators';
import { isCollided, direction, sumOfAreas } from '../utils/math';
import randomAsteroids from '../utils/randomAsteroids';
import { SETTINGS } from '../constants';

// This reducer allows for state changes which rely on interactions between various moving objects,
// specifically to handle collisions.
export default function movingObjects(state = {}, action) {
  const {
    asteroids: {
      minimumRadius,
      startingMinimumArea,
    },
    debris: {
      number: numDebris,
      distance: debrisDistance,
    },
  } = SETTINGS;

  // TODO: This seems pretty messy
  const reducedAsteroids = asteroids(state.asteroids, action);
  const reducedBullets = bullets(state.bullets, action);
  const reducedShip = ship(state.ship, action);
  const reducedDebris = debris(state.debris, action);

  switch (action.type) {
    case MOVE:
      const collidedBullets = [];
      const collidedAsteroids = [];
      reducedAsteroids.forEach((asteroid) => {
        reducedBullets.forEach((bullet) => {
          if (isCollided(bullet, asteroid)) {
            collidedBullets.push(bullet);
            collidedAsteroids.push(asteroid);
          }
        });
      });

      const notHitAsteroids = reducedAsteroids.filter(asteroid => !collidedAsteroids.includes(asteroid));
      const subAsteroids = collidedAsteroids.reduce((prev, current) => {
        return prev.concat(randomAsteroids(2, {
          radius: current.radius / Math.sqrt(2),
          pos: current.pos,
        }));
      }, []).filter(asteroid => asteroid.radius > minimumRadius);

      const destroyedAsteroids = collidedAsteroids.filter(asteroid => (
        asteroid.radius / Math.sqrt(2) < minimumRadius
      ));

      const angle = 360 / numDebris;
      const newDebris = destroyedAsteroids.reduce((prev, current) => {
        const debrisForAsteroid = times(numDebris, index => {
          return {
            pos: current.pos,
            vel: direction(angle * index),
            distance: debrisDistance,
          };
        });
        return prev.concat(debrisForAsteroid);
      }, []);

      const newAsteroids = notHitAsteroids.concat(subAsteroids);
      const additionalAsteroids = sumOfAreas(newAsteroids) < startingMinimumArea ? randomAsteroids(1) : [];

      return {
        ship: reducedShip,
        bullets: reducedBullets.filter(bullet => !collidedBullets.includes(bullet)),
        asteroids: newAsteroids.concat(additionalAsteroids),
        debris: reducedDebris.concat(newDebris),
      };
    default:
      return {
        asteroids: reducedAsteroids,
        bullets: reducedBullets,
        ship: reducedShip,
        debris: reducedDebris,
      };
  }
}
