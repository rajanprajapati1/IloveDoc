# Bug Report: Caret Navigation Is Off by One Before Highlight or Image Spans

## Status

Open

## Priority

Medium

## Area

Main content area editor

## Summary

When moving left from the start of a highlight or image-reference span, the caret is positioned one character earlier than expected in the previous text node. This makes keyboard navigation around inline spans feel inaccurate.

## User-Visible Symptoms

- Pressing left arrow near a highlight or image token can place the caret in the wrong position.
- Typing after the move can insert text one character earlier than expected.
- Editing near inline tokens feels imprecise.

## Reproduction Steps

1. Insert text followed by a highlight or image-reference span.
2. Place the caret at the start boundary of the span.
3. Press left arrow.
4. Type a character.
5. Observe the insertion point.

## Expected Result

- The caret should move to the logical end of the previous text node.

## Actual Result

- The caret is placed one character before the logical end position.

## Impact

Medium. This affects precision editing around inline editor tokens.

## Code Touchpoint

- `src/components/docbook/DocbookEditorSurface.js:658`

## Notes

- The current range start uses `length - 1` for the previous text node.
- That produces a caret position before the last character instead of after it.
