// @flow

import React from 'react';
import type { PowerupType } from '../types/index';
import { POWERUP_TYPES, DESCRIPTION_FOR_POWERUP, COLOR_FOR_POWERUP } from '../constants';

export default function Instructions() {
  return (
    <div id="instructions">
      <div id="controls">
        <p>Controls: </p>
        <ul>
          <li>
            <strong>Rotate ship: </strong>Left/Right arrows
          </li>

          <li>
            <strong>Move ship: </strong>Up arrow
          </li>

          <li>
            <strong>Shoot: </strong>Space bar
          </li>

          <li><strong>Pause: </strong>P</li>

          <li><strong>Bomb: </strong>B</li>
        </ul>
      </div>

      <div id="powerups">
        <p>Powerups: </p>
        <ul id="powerups">
          {POWERUP_TYPES.map(powerupType => {
            const description = DESCRIPTION_FOR_POWERUP.get(powerupType);
            const color = COLOR_FOR_POWERUP.get(powerupType);
            return (
              <li style={{ color }} key={description} className="powerup-description">
                {description}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
