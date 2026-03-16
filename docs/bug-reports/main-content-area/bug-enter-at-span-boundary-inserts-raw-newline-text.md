# Bug Report: Enter at Span Boundary Inserts Raw Newline Text

## Status

Open

## Priority

Medium

## Area

Main content area editor

## Summary

When the caret is at the boundary of a highlight or image-reference span and the user presses Enter, the editor inserts a raw newline text node instead of a normal editor line-break structure. This can create inconsistent behavior in a `contentEditable` surface.

## User-Visible Symptoms

- Pressing Enter near highlight/image spans can behave differently from normal editor line breaks.
- Line breaks around inline spans can feel inconsistent or render unpredictably.
- The result may differ from paragraph Enter behavior elsewhere in the editor.

## Reproduction Steps

1. Add highlighted text or an image-reference token in the editor.
2. Place the caret at the start or end boundary of that span.
3. Press Enter.
4. Compare the result with Enter behavior in a normal paragraph position.

## Expected Result

- Enter should create a normal editor line-break or block transition consistent with the rest of the editor.

## Actual Result

- The boundary handler inserts a raw `"\n"` text node.

## Impact

Medium. This creates inconsistent editor behavior around inline special spans.

## Code Touchpoint

- `src/components/docbook/DocbookEditorSurface.js:679`

## Notes

- `contentEditable` editors usually need DOM structures that match browser editing expectations.
- Raw newline text does not reliably behave like a standard editor line break.
