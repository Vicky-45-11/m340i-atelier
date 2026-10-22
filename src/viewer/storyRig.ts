/** Mutable values shared between the story's DOM handlers and its 3D scene.
 *  They change every frame, so they live outside React state. */
export const storyRig = {
  /** beat index plus fraction through that beat */
  progress: 0,
  /** extra orbit angle from dragging, in radians */
  yaw: 0,
  yawVelocity: 0,
  dragging: false,
}
