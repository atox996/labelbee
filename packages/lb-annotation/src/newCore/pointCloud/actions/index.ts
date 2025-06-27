import Viewer from '../views/Viewer';
import Action from './Action';
import SelectAction from './SelectAction';
import OrbitControlsAction from './OrbitControlsAction';

type ActionMap = {
  Select: new (viewer: Viewer) => SelectAction;
  OrbitControls: new (viewer: Viewer) => OrbitControlsAction;
};

type ActionInstanceMap = {
  [K in keyof ActionMap]: InstanceType<ActionMap[K]>;
};

type ActionName = keyof ActionMap;

const Actions = new Map<ActionName, ActionMap[ActionName]>([
  ['Select', SelectAction],
  ['OrbitControls', OrbitControlsAction],
]);

export { Action, Actions };
export type { ActionInstanceMap, ActionName };
