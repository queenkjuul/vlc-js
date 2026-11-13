/** Constant values that represent DVD menu navigation commands in VLC */
export const VlcNavigationCommands = {
  Activate: 0,
  Up: 1,
  Down: 2,
  Left: 3,
  Right: 4,
}

/**
 * Valid arguments to be passed to a VLC navigation function
 *
 * @typedef {VlcNavigationCommand}
 * @export
 */
export type VlcNavigationCommand =
  (typeof VlcNavigationCommands)[keyof typeof VlcNavigationCommands]
