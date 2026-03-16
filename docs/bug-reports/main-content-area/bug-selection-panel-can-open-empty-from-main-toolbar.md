# Bug Report: Selection Panel Can Open Empty From Main Toolbar

## Status

Open

## Priority

Medium

## Area

Main content area editor

## Summary

The main toolbar button for opening the selection/images panel uses the live browser selection at open time. If the click collapses the selection first, the panel opens with empty content even though the user had selected text in the editor.

## User-Visible Symptoms

- The user selects text in the editor.
- The user clicks the main "View images & selection" button.
- The panel opens, but the selected content is missing.

## Reproduction Steps

1. Select text in the main content editor.
2. Click the main toolbar button labeled "View images & selection".
3. Observe the panel content.

## Expected Result

- The selection panel should reflect the intended editor selection.

## Actual Result

- The panel can open empty because it depends on the current live selection instead of a preserved editor selection.

## Impact

Medium. This weakens a key editor workflow and makes the panel feel inconsistent.

## Code Touchpoints

- `src/components/docbook/DocbookEditorSurface.js:935`
- `src/components/docbook/DocbookEditorSurface.js:937`
- `src/app/page.js:867`
- `src/app/page.js:875`
- `src/app/page.js:877`

## Notes

- The floating selection menu captures selection before some actions.
- The main toolbar path calls the open handler directly, which makes it more vulnerable to selection collapse.
