import newPosition from '../utils/newPosition';
import randomAsteroids from '../utils/randomAsteroids';
import { MOVE, ADD_RANDOM_ASTEROIDS } from '../actionCreators';

// state is array of objects with { pos, vel, radius }
export default function asteroids(state = [], action) {
  switch (action.type) {
    case MOVE:
      return state.map(asteroid => ({
        ...asteroid,
        pos: newPosition(asteroid),
      }));
    case ADD_RANDOM_ASTEROIDS:
      return state.concat(randomAsteroids(action.numAsteroids));
    default:
      return state;
  }
}
