# Bug Report: Image Records Can Be Created Without Valid Editor Placement

## Status

Open

## Priority

High

## Area

Main content area editor

## Summary

Image data can be saved before the code verifies that a valid editor selection or caret exists. If selection restoration fails or the current selection is outside the editor, the image record is created but no editor reference is inserted.

## User-Visible Symptoms

- An image action can succeed internally without producing visible content in the editor.
- The user may believe the image action failed because no token appears.
- Repeated retries can create hidden or orphaned image data.

## Reproduction Pattern

1. Open the main content editor.
2. Start an image attach or paste flow.
3. Trigger the action when the selection is missing, collapsed unexpectedly, or outside the editor.
4. Observe that no visible image token is inserted.

## Expected Result

- Image data should only be saved when the editor has a valid placement target.
- If placement is invalid, the action should fail cleanly without creating hidden records.

## Actual Result

- Storage happens first.
- Validation happens afterward.
- Early returns can leave image data created without visible editor placement.

## Impact

High. This creates invisible state and makes editor behavior unreliable.

## Code Touchpoints

- `src/app/page.js:426`
- `src/app/page.js:442`
- `src/app/page.js:450`
- `src/app/page.js:803`
- `src/app/page.js:818`
- `src/app/page.js:826`

## Notes

- The same pattern exists in both image-attach and paste-image paths.
- This is a data/UX consistency issue in the main content area.
