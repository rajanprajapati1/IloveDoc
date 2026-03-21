"use client";

import { memo, useMemo } from "react";
import { Box } from "@mui/material";
import { getEditorSx } from "./editorStyles";

/**
 * The contentEditable editor area with all its styling.
 */
function EditorContentArea({
  editorRef,
  editorFontScale,
  handleEditorKeyDown,
  handleInput,
  handleBlur,
  handleMouseUp,
  handleKeyUp,
  handleClick,
  onEditorDoubleClick,
  onEditorMouseMove,
  onEditorMouseLeave,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleEditorScroll,
  handlePaste,
}) {
  const editorSx = useMemo(() => getEditorSx(editorFontScale), [editorFontScale]);

  return (
    <Box
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder="Start writing your note..."
      onKeyDown={handleEditorKeyDown}
      onInput={handleInput}
      onBlur={handleBlur}
      onMouseUp={handleMouseUp}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      onDoubleClick={onEditorDoubleClick}
      onMouseMove={onEditorMouseMove}
      onMouseLeave={onEditorMouseLeave}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onScroll={handleEditorScroll}
      onPaste={handlePaste}
      sx={editorSx}
    />
  );
}

export default memo(EditorContentArea);
