// @flow

import { pick, times } from 'lodash';
import { combineReducers } from 'redux';
import ship from './ship';
import bullets from './bullets';
import asteroids from './asteroids';
import debris from './debris';
import powerups from './powerups';
import bombs from './bombs';
import queuedSounds from './queuedSounds';
import multiplier from './multiplier';
import { MOVE, SET_MODE, RESET, TRIGGER_BOMB } from '../actions';
import { SETTINGS, DEFAULT_MODE } from '../constants';
import {
  debrisForDestroyedAsteroids,
  subASteroidsForCollidedAsteroids,
  additionalAsteroidsForCurrentAsteroids,
  handleCollisions,
} from '../utils/asteroidCollisions';
import type {
  Asteroid,
  Debris,
  Action,
  DifficultyState,
  WithRadius,
  MovingObjectsState,
} from '../types/types';
import { Sound } from '../types/enums';

const defaultState: MovingObjectsState = {
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
  queuedSounds: [],
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
  queuedSounds,
  multiplier,
});

// This reducer allows for state changes which rely on interactions between various moving objects,
// specifically to handle collisions.
export default function movingObjects(
  state: MovingObjectsState = defaultState,
  action: Action
): MovingObjectsState {
  // TODO: This seems pretty messy
  const subState = subReducer(pick(state, [
    'asteroids',
    'ship',
    'bullets',
    'debris',
    'powerups',
    'bombs',
    'queuedSounds',
    'multiplier',
  ]), action);
  const defaultNewState: MovingObjectsState = {
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
        beginBulletPowerup,
        beginFreezePowerup,
        bombsDiff,
        resetMultiplier,
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

      const newSounds = [
        ...times(collidedAsteroids.length, () => Sound.ASTEROID_BREAK),
        ...times(destroyedAsteroids.length, () => Sound.ASTEROID_DESTROY),
      ];

      return {
        ship: newShip,
        bullets: notCollidedBullets,
        asteroids: newAsteroids.concat(additionalAsteroids),
        debris: subState.debris.concat(newDebris),
        powerups: notCollidedPowerups,
        score: defaultNewState.score + pointsAwarded,
        multiplier: resetMultiplier ? 1 : defaultNewState.multiplier,
        lives: defaultNewState.lives + livesDiff,
        bombs: defaultNewState.bombs + bombsDiff,
        queuedSounds: defaultNewState.queuedSounds.concat(newSounds),
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
          queuedSounds: defaultNewState.queuedSounds.concat(
            times(state.asteroids.length, () => Sound.ASTEROID_DESTROY)
          ),
        };
      }
      return defaultNewState;
    case RESET:
    case SET_MODE:
      if (action.payload == null) {
        return state;
      }
      return { ...defaultNewState, lives: SETTINGS.startingLives[action.payload.mode] };
    default:
      return defaultNewState;
  }
}
