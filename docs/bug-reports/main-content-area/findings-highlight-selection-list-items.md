# Findings: Highlight Selection in List Items

## Focus

Observed behavior in the main editable content area when highlighting text inside list items.

## Confirmed Problem Pattern

- The issue is specific to the main editor surface.
- The problem is most visible inside ordered and unordered list items.
- The problem is triggered during highlight apply and highlight removal interactions.
- The issue is interaction-related, not just visual styling.

## Observed Symptoms

- Highlighted text can look misaligned relative to the selected list text.
- The highlighted segment can appear taller than the surrounding line.
- Double-clicking a highlighted region can produce unwanted spacing changes around the same list item.
- The interaction can make it feel like text above or below the target item was affected.

## Reproduction Pattern

1. Open the main content editor.
2. Create a numbered or bulleted list.
3. Select part of a single list item.
4. Apply highlight.
5. Double-click the highlighted text to remove it.
6. Observe spacing, selection state, and neighboring list rows.

## Expected vs Actual

Expected:

- Only the selected text should be highlighted.
- List row height should remain stable.
- Double-click should only remove the clicked highlight.

Actual:

- Highlight rendering is not always visually stable.
- Spacing can look wrong after removal.
- The interaction does not feel isolated to the clicked text in all cases.

## Investigation Notes

- The main editor uses a `contentEditable` surface.
- Highlight behavior appears to depend on browser DOM selection/range behavior.
- List-item content is more fragile than plain paragraph content for inline wrappers.
- Double-click interactions are especially sensitive because native text selection also changes on the same action.

## Likely Touchpoints

- `src/app/page.js`
- `src/components/docbook/DocbookEditorSurface.js`

## Scope Boundary

- This finding is for the main content area only.
- This finding does not document a fix.
- This finding does not include implementation steps.

## Severity

High for editor experience, because it affects core writing interactions in the primary note area.
