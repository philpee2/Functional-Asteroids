// @flow

import { pick } from 'lodash';
import { combineReducers } from 'redux';
import ship from './ship';
import bullets from './bullets';
import asteroids from './asteroids';
import debris from './debris';
import powerups from './powerups';
import bombs from './bombs';
import { MOVE, SET_MODE, RESET, TRIGGER_BOMB } from '../actions';
import { SETTINGS, DEFAULT_MODE } from '../constants';
import {
  debrisForDestroyedAsteroids,
  subASteroidsForCollidedAsteroids,
  additionalAsteroidsForCurrentAsteroids,
  handleCollisions,
} from '../utils/asteroidCollisions';
import type {
  Ship,
  Asteroid,
  Bullet,
  Debris,
  Action,
  DifficultyState,
  WithRadius,
  Powerup,
} from '../types/index';

type State = {
  asteroids: Asteroid[],
  bullets: Bullet[],
  ship: Ship,
  debris: Debris[],
  powerups: Powerup[],
  score: number,
  lives: number,
  multiplier: number,
  bulletPowerupStartFrame: ?number,
  freezePowerupStartFrame: ?number,
  bombs: number,
};

const defaultState: State = {
  asteroids: [],
  bullets: [],
  ship: SETTINGS.ship.defaultShip,
  debris: [],
  powerups: [],
  score: 0,
  lives: SETTINGS.startingLives[DEFAULT_MODE],
  multiplier: 1,
  bulletPowerupStartFrame: null,
  freezePowerupStartFrame: null,
  bombs: 0,
};

function smallerRadius(distance: number): (obj: WithRadius) => boolean {
  return ({ radius }) => radius < distance;
}

const shouldBeDestroyed = smallerRadius(SETTINGS.asteroids.minimumRadius * Math.sqrt(2));

function pointsForCollision(multiplier: number): (asteroid: Asteroid) => number {
  const { pointsForBreak, pointsForDestroy } = SETTINGS;
  return (asteroid: Asteroid): number => (
    multiplier * (shouldBeDestroyed(asteroid) ? pointsForDestroy : pointsForBreak)
  );
}

const subReducer = combineReducers({
  asteroids,
  bullets,
  debris,
  ship,
  powerups,
  bombs,
});

// This reducer allows for state changes which rely on interactions between various moving objects,
// specifically to handle collisions.
export default function movingObjects(state: State = defaultState, action: Action): State {
  // TODO: This seems pretty messy
  const subState = subReducer(pick(state, [
    'asteroids',
    'ship',
    'bullets',
    'debris',
    'powerups',
    'bombs',
  ]), action);
  const defaultNewState: State = {
    ...state,
    ...subState,
  };
  switch (action.type) {
    case MOVE: {
      if (action.payload == null) {
        return state;
      }
      const {
        difficulty,
        frameCount,
      }: {
        difficulty: DifficultyState,
        frameCount: number,
      } = action.payload;
      const {
        livesDiff,
        notCollidedBullets,
        collidedAsteroids,
        notCollidedAsteroids,
        notCollidedPowerups,
        pointsAwarded,
        newShip,
        multiplierDiff,
        beginBulletPowerup,
        beginFreezePowerup,
        addBomb,
      } = handleCollisions({
        ship: defaultNewState.ship,
        asteroids: defaultNewState.asteroids,
        bullets: defaultNewState.bullets,
        powerups: defaultNewState.powerups,
        pointsForCollision: pointsForCollision(state.multiplier),
        frameCount,
      });

      const bulletPowerupStartFrame = beginBulletPowerup
        ? frameCount
        : defaultNewState.bulletPowerupStartFrame;
      const freezePowerupStartFrame = beginFreezePowerup
        ? frameCount
        : defaultNewState.freezePowerupStartFrame;
      const subAsteroids: Asteroid[] = subASteroidsForCollidedAsteroids(collidedAsteroids);
      const destroyedAsteroids: Asteroid[] = collidedAsteroids.filter(shouldBeDestroyed);
      const newDebris: Debris[] = debrisForDestroyedAsteroids(destroyedAsteroids);
      const newAsteroids: Asteroid[] = notCollidedAsteroids.concat(subAsteroids);
      const additionalAsteroids: Asteroid[] = additionalAsteroidsForCurrentAsteroids(
        newAsteroids,
        difficulty
      );
      return {
        ship: newShip,
        bullets: notCollidedBullets,
        asteroids: newAsteroids.concat(additionalAsteroids),
        debris: subState.debris.concat(newDebris),
        powerups: notCollidedPowerups,
        score: defaultNewState.score + pointsAwarded,
        multiplier: defaultNewState.multiplier + multiplierDiff,
        lives: defaultNewState.lives + livesDiff,
        bombs: addBomb ? defaultNewState.bombs + 1 : defaultNewState.bombs,
        bulletPowerupStartFrame,
        freezePowerupStartFrame,
      };
    }
    case TRIGGER_BOMB:
      if (state.bombs > 0) {
        return {
          ...defaultNewState,
          asteroids: [],
          debris: defaultNewState.debris.concat(
            debrisForDestroyedAsteroids(defaultNewState.asteroids)
          ),
        };
      }
      return defaultNewState;
    case RESET:
    case SET_MODE:
      if (action.payload == null) {
        return state;
      }
      return { ...defaultNewState, lives: SETTINGS.startingLives[action.payload] };
    default:
      return defaultNewState;
  }
}
