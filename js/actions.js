// @flow

import type { Asteroid, Ship, DifficultyState, Mode, Action, TurnDirection } from './types/index';

export const MOVE = 'MOVE';
export const ADD_ASTEROID = 'ADD_ASTEROID';
export const THRUST_SHIP = 'THRUST_SHIP';
export const ROTATE_SHIP = 'ROTATE_SHIP';
export const STOP_THRUSTING_SHIP = 'STOP_THRUSTING_SHIP';
export const SHOOT = 'SHOOT';
export const TOGGLE_PAUSE = 'TOGGLE_PAUSE';
export const RESET = 'RESET';
export const SET_MODE = 'SET_MODE';
export const ADD_INITIAL_ASTEROIDS = 'ADD_INITIAL_ASTEROIDS';
export const TRIGGER_BOMB = 'TRIGGER_BOMB';

export function move(payload: {
  difficulty: DifficultyState,
  frameCount: number,
  mode: Mode,
  lives: number,
  freezePowerupStartFrame: number,
}): Action {
  return {
    type: MOVE,
    payload,
  };
}

export function addAsteroid(asteroid: Asteroid): Action {
  return { type: ADD_ASTEROID, payload: asteroid };
}

export function thrustShip(): Action {
  return { type: THRUST_SHIP };
}

export function rotateShip(direction: TurnDirection): Action {
  return { type: ROTATE_SHIP, payload: direction };
}

export function stopThrustingShip(): Action {
  return { type: STOP_THRUSTING_SHIP };
}

export function shoot(
  ship: Ship,
  mode: Mode,
  bulletPowerupStartFrame: number,
  frameCount: number
): Action {
  return {
    type: SHOOT,
    payload: {
      ship,
      mode,
      bulletPowerupStartFrame,
      frameCount,
    },
  };
}

export function togglePause(): Action {
  return { type: TOGGLE_PAUSE };
}

export function reset(mode: Mode): Action {
  return { type: RESET, payload: mode };
}

export function setMode(newMode: Mode): Action {
  return { type: SET_MODE, payload: newMode };
}

export function addInitialAsteroids(mode: Mode): Action {
  return { type: ADD_INITIAL_ASTEROIDS, payload: mode };
}

export function triggerBomb(): Action {
  return { type: TRIGGER_BOMB };
}
