# Bug Report: Drag-and-Drop Images Do Not Create a Visible Editor Token

## Status

Open

## Priority

High

## Area

Main content area editor

## Summary

Dragging an image file into the main editor stores the image data but does not insert any visible token or reference into the editor content. The result is that the user completes a drag-and-drop action with no visible editor output.

## User-Visible Symptoms

- Dropping an image into the editor appears to do nothing.
- No visible image token is inserted at the drop position.
- The editor content does not visibly change after the drop.

## Reproduction Steps

1. Open the main content editor.
2. Drag an image file into the editable note area.
3. Drop it at a visible caret position.
4. Observe the editor content immediately after drop.

## Expected Result

- The image drop should create a visible editor artifact at the drop position.
- The user should see an inserted token, attachment marker, or other content representation.

## Actual Result

- The image is processed internally, but no visible token is inserted into the editor.
- The action has no clear user-facing result in the writing surface.

## Impact

High. This makes drag-and-drop feel broken and can lead users to retry or assume the drop failed.

## Code Touchpoints

- `src/app/page.js:593`
- `src/app/page.js:596`

## Notes

- The current path stores dropped images and updates the image URL map.
- The drop branch returns before inserting editor content or syncing visible note HTML.
