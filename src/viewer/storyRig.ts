/** Mutable values shared between the page's DOM handlers and the 3D scenes.
 *  They change every frame, so they live outside React state. */
export const storyRig = {
  /** beat index plus fraction through that beat */
  progress: 0,
  /** extra orbit angle from dragging, in radians */
  yaw: 0,
  yawVelocity: 0,
  dragging: false,
  /** pointer position, -1 to 1 from the centre of the screen */
  pointer: { x: 0, y: 0 },
  /** wheel spin in radians per second; the launch game drives it */
  wheelSpeed: 0,
  /** engine load, 0 to 1: shakes the camera and brightens the lamps */
  rev: 0,
}
