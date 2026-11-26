import { livingRoomStage } from './livingRoom.js';
import { studyRoomStage } from './studyRoom.js';

// 新しいステージを追加するときはここに1行足すだけ
export const STAGES = [
  livingRoomStage,
  studyRoomStage
];

export const DEFAULT_STAGE_ID = STAGES[0].id;

export function getStageById(id) {
  return STAGES.find(s => s.id === id) || STAGES[0];
}
