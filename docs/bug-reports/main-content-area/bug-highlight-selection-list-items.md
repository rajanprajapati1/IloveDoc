# Bug Report: Highlighting List Items Breaks Selection Behavior

## Status

Open

## Priority

High

## Area

Main content area editor

## Summary

When a user selects text inside a list item in the main content editor and applies highlight styling, the result is inconsistent. The highlight does not always stay visually aligned with the selected list content, and removing the highlight by double-clicking can cause incorrect spacing or selection behavior around nearby list items.

## User-Visible Symptoms

- Highlighted text inside numbered or bulleted lists does not always look anchored to the exact selected text.
- The highlighted region can appear visually too tall or misaligned in the list row.
- Double-clicking a highlighted section to remove the highlight can create the impression that spacing has shifted above or below the item.
- The interaction feels unstable compared to normal paragraph highlighting.

## Reproduction Steps

1. Open the app and go to the main content editor.
2. Create or open a note with numbered or bulleted list items.
3. Select part of one list item.
4. Apply the custom highlight action from the editor controls.
5. Observe the highlight rendering.
6. Double-click the highlighted text to remove the highlight.
7. Observe spacing, selection, and neighboring list-item behavior.

## Expected Result

- Highlight should wrap only the intended selected text.
- Highlight should not change line spacing for the current item or adjacent items.
- Removing highlight should affect only the clicked highlight.
- Double-click removal should not create odd selection state, extra spacing, or cross-item visual artifacts.

## Actual Result

- Highlight behavior is inconsistent in list content.
- Visual spacing or alignment appears wrong after highlight or unhighlight actions.
- Double-click removal can feel like it affects more than the clicked text.

## Suspected Root Cause

This issue is likely caused by a combination of DOM-range handling and inline highlight styling inside a `contentEditable` editor:

- The editor applies highlight by wrapping the browser selection directly.
- Browser selections inside lists can include fragile DOM boundaries.
- Wrapping a raw selection can behave differently depending on where the selection starts and ends inside the list structure.
- Double-click behavior is sensitive because the browser also changes selection state during the same interaction.
- Inline highlight styling that adds vertical padding can visually increase line height inside list rows.

## Likely Affected Files

- `src/app/page.js`
- `src/components/docbook/DocbookEditorSurface.js`

## Risk

High for editor UX. This affects trust in text editing behavior and makes the main writing surface feel unstable.

## Scope Notes

- This report is limited to the main content area.
- This report does not cover sticky notes, side panels, or image tokens unless they intersect the same selection logic.
- This report documents the bug only. It does not implement a fix.

## Acceptance Criteria

- Highlighting text inside a single list item is stable and visually correct.
- Highlighting does not add unwanted vertical spacing.
- Removing highlight via double-click is isolated to the clicked highlight only.
- Adjacent list items remain visually unchanged.
- The behavior is consistent for both ordered and unordered lists.

## Validation Checklist

- Ordered list: highlight middle text in one item.
- Ordered list: highlight full text in one item.
- Unordered list: highlight partial text in one item.
- Remove highlight by double-click.
- Reapply highlight after removal.
- Verify no spacing shift above or below the item.
- Verify paragraphs outside lists still behave correctly.
