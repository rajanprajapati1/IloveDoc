"use client";

import { useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { noteColorOptions } from "../shared";
import { loadAppearanceSettings } from "../CustomizationPanel";
import StickyNoteBoard from "../StickyNoteBoard";

import useSlashCommands from "./useSlashCommands";
import useTokenSuggestions from "./useTokenSuggestions";
import useEditorKeyDown from "./useEditorKeyDown";
import useEditorEvents from "./useEditorEvents";
import useGrammarChecker from "./useGrammarChecker";

import EditorToolbar from "./EditorToolbar";
import EditorConnectionsDock from "./EditorConnectionsDock";
import EditorContentArea from "./EditorContentArea";
import SlashCommandMenu from "./SlashCommandMenu";
import TableControlsOverlay from "./TableControlsOverlay";
import TokenMenu from "./TokenMenu";
import GrammarOverlay from "./GrammarOverlay";

export default function DocbookEditorSurface({
  activeNote,
  allNotes = [],
  linkedNotes = [],
  backlinkNotes = [],
  autoSave = true,
  onAutoSaveChange,
  editorRef,
  imageUrlMap = {},
  stickyNotes = [],
  activeStickyNoteId,
  onOpenLinkedNote,
  onConnectNote,
  onDisconnectNote,
  onTitleChange,
  onEditorInput,
  onEditorBlur,
  onEditorSelectionChange,
  onEditorClick,
  onEditorDoubleClick,
  onEditorMouseMove,
  onEditorMouseLeave,
  onEditorDragOver,
  onEditorDragLeave,
  onEditorDrop,
  onOpenSelectionPanel,
  onPasteImage,
  onNoteFontSizeDecrease,
  onFontSizeDecrease,
  onAddStickyNote,
  onOpenStickyNote,
  onUpdateStickyNote,
  onMoveStickyNote,
  onStickyDragStateChange,
  onDeleteStickyNote,
  onNoteColorChange,
  onNoteFontSizeIncrease,
  onFontSizeIncrease,
  syncBadgeState,
  collapseSidebar,
  customPeople = [],
  customFolders = [],
  customLocations = [],
  onOpenCustomization,
  onPeopleChange,
  onFoldersChange,
  onLocationsChange,
  aiWorking = false,
}) {
  const [stickyNotesVisible, setStickyNotesVisible] = useState(true);
  const [grammarEnabled, setGrammarEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("docbook_grammar_enabled");
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });
  const [editorScrollState, setEditorScrollState] = useState({
    scrollTop: 0,
    viewportHeight: 0,
    contentHeight: 0,
  });

  const activeNoteTint = activeNote?.color || noteColorOptions[0].value;
  const editorFontScale = activeNote?.fontScale || 1;
  const imageEntries = Object.entries(imageUrlMap);

  /* ── Dynamic selection highlight color ── */
  useEffect(() => {
    const applySelectionColor = () => {
      const { selectionColor } = loadAppearanceSettings();
      const color = selectionColor || "#b3e5fc";
      let tag = document.getElementById("docbook-selection-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "docbook-selection-style";
        document.head.appendChild(tag);
      }
      tag.textContent = `::selection { background-color: ${color}; color: inherit; }`;
    };
    applySelectionColor();
    window.addEventListener("docbook-appearance-changed", applySelectionColor);
    return () => window.removeEventListener("docbook-appearance-changed", applySelectionColor);
  }, []);

  /* ── Hooks ── */
  const { mappedLints, applySuggestion, updateRects, triggerLint } = useGrammarChecker({
    editorRef,
  });

  useEffect(() => {
    // Initial lint for existing content
    if (grammarEnabled) triggerLint();
  }, [activeNote?.id, triggerLint, grammarEnabled]);

  const toggleGrammar = useCallback(() => {
    setGrammarEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("docbook_grammar_enabled", JSON.stringify(next));
      return next;
    });
  }, []);

  /* ── Scroll state ── */
  const refreshEditorScrollState = useCallback(() => {
    const editor = editorRef?.current;
    if (!editor) return;
    updateRects();
    setEditorScrollState((prev) => {
      const next = {
        scrollTop: editor.scrollTop,
        viewportHeight: editor.clientHeight,
        contentHeight: Math.max(editor.scrollHeight, editor.clientHeight),
      };
      if (prev.scrollTop === next.scrollTop && prev.viewportHeight === next.viewportHeight && prev.contentHeight === next.contentHeight) return prev;
      return next;
    });
  }, [editorRef, updateRects]);

  const handleWrappedEditorInput = useCallback((event) => {
    if (onEditorInput) onEditorInput(event);
    if (grammarEnabled) triggerLint();
  }, [onEditorInput, triggerLint, grammarEnabled]);

  const {
    slashMenu,
    setSlashMenu,
    activeSuggestions,
    getDateSuggestions,
    closeSlashMenu,
    refreshSlashMenu,
    applySlashSuggestion,
  } = useSlashCommands({
    activeNote,
    stickyNotes,
    onEditorInput: handleWrappedEditorInput,
    onAddStickyNote,
    onOpenStickyNote,
  });

  const {
    tokenMenu,
    setTokenMenu,
    activeTokenSuggestions,
    closeTokenMenu,
    refreshTokenMenu,
    applyTokenSuggestion,
  } = useTokenSuggestions({
    customPeople,
    customFolders,
    customLocations,
    onEditorInput: handleWrappedEditorInput,
    onPeopleChange,
    onFoldersChange,
    onLocationsChange,
  });

  // These are now managed inside EditorConnectionsDock, but editor click also needs to close them.
  // We pass no-op stubs to useEditorEvents:
  const noop = useCallback(() => { }, []);

  const {
    dropCaret,
    handlePaste,
    handleClick,
    handleInput,
    handleKeyUp,
    handleMouseUp,
    handleBlur,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleEditorScroll,
  } = useEditorEvents({
    editorRef,
    onEditorInput: handleWrappedEditorInput,
    onEditorBlur,
    onEditorSelectionChange,
    onEditorClick,
    onEditorDragOver,
    onEditorDragLeave,
    onEditorDrop,
    onPasteImage,
    refreshSlashMenu,
    refreshTokenMenu,
    closeSlashMenu,
    closeTokenMenu,
    refreshEditorScrollState,
    setConnectionsDockOpen: noop,
    setLinkSearchOpen: noop,
  });

  const handleEditorKeyDown = useEditorKeyDown({
    slashMenu,
    setSlashMenu,
    activeSuggestions,
    applySlashSuggestion,
    closeSlashMenu,
    tokenMenu,
    setTokenMenu,
    activeTokenSuggestions,
    applyTokenSuggestion,
    closeTokenMenu,
    onEditorInput: handleWrappedEditorInput,
  });

  /* ── Sticky notes toggle ── */
  const toggleStickyNotesVisibility = useCallback(() => {
    setStickyNotesVisible((prev) => {
      const next = !prev;
      if (!next) onStickyDragStateChange?.({ stickyId: "", targetNoteId: "" });
      return next;
    });
  }, [onStickyDragStateChange]);

  /* ── Effects ── */
  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return undefined;
    refreshEditorScrollState();
    const handleResize = () => refreshEditorScrollState();
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); };
  }, [activeNote?.id, editorFontScale, editorRef, refreshEditorScrollState]);

  return (
    <Box
      sx={{
        order: { xs: 1, lg: 2 },
        minWidth: 0,
        width: "100%",
        height: "100%",
        minHeight: 0,
        p: "10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: { xs: 360, lg: 0 },
          width: "100%",
          overflow: "hidden",
          borderRadius: 5,
          background: `linear-gradient(160deg, ${alpha(activeNoteTint, 0.18)} 0%, rgba(255,251,245,0.9) 32%, rgba(246,239,229,0.9) 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 40px ${alpha("#7b5f39", 0.08)}`,
        }}
      >
        {/* AI working border effect */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: "6px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
            zIndex: 1,
            opacity: aiWorking ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "300%",
              height: "300%",
              background: "conic-gradient(from 0deg, transparent 25%, #1976d2 40%, #1c77f0ff 50%, #d22519ff 60%, transparent 75%)",
              animation: aiWorking ? "spinBorder 5s linear infinite" : "none",
              transform: "translate(-50%, -50%)",
            },
            "@keyframes spinBorder": {
              "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
              "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
            },
          }}
        />

        {/* Toolbar */}
        <EditorToolbar
          activeNote={activeNote}
          activeNoteTint={activeNoteTint}
          autoSave={autoSave}
          onAutoSaveChange={onAutoSaveChange}
          syncBadgeState={syncBadgeState}
          collapseSidebar={collapseSidebar}
          onTitleChange={onTitleChange}
          onNoteColorChange={onNoteColorChange}
          onNoteFontSizeDecrease={onNoteFontSizeDecrease}
          onFontSizeDecrease={onFontSizeDecrease}
          onNoteFontSizeIncrease={onNoteFontSizeIncrease}
          onFontSizeIncrease={onFontSizeIncrease}
          onAddStickyNote={onAddStickyNote}
          onOpenSelectionPanel={onOpenSelectionPanel}
          stickyNotesVisible={stickyNotesVisible}
          onToggleStickyNotes={toggleStickyNotesVisibility}
          grammarEnabled={grammarEnabled}
          onToggleGrammar={toggleGrammar}
          imageEntries={imageEntries}
          aiWorking={aiWorking}
          getDateSuggestions={getDateSuggestions}
        />

        {/* Connections dock */}
        <EditorConnectionsDock
          activeNote={activeNote}
          activeNoteTint={activeNoteTint}
          allNotes={allNotes}
          linkedNotes={linkedNotes}
          backlinkNotes={backlinkNotes}
          onOpenLinkedNote={onOpenLinkedNote}
          onConnectNote={onConnectNote}
          onDisconnectNote={onDisconnectNote}
        />

        {/* Decorative blurs */}
        <Box sx={{ position: "absolute", left: -80, top: 40, width: "100%", height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,253,248,0.95) 0%, rgba(255,253,248,0) 72%)", filter: "blur(8px)" }} />
        <Box sx={{ position: "absolute", right: -60, bottom: 24, width: 260, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(activeNoteTint, 0.26)} 0%, rgba(240,230,215,0) 72%)`, filter: "blur(18px)" }} />

        {/* Sticky notes */}
        {stickyNotesVisible && (
          <StickyNoteBoard
            notes={stickyNotes}
            activeNoteId={activeNote?.id}
            activeStickyNoteId={activeStickyNoteId}
            editorScrollRef={editorRef}
            scrollTop={editorScrollState.scrollTop}
            viewportHeight={editorScrollState.viewportHeight}
            contentHeight={editorScrollState.contentHeight}
            onSelectLink={onOpenStickyNote}
            onUpdateLink={onUpdateStickyNote}
            onMoveLinkToNote={onMoveStickyNote}
            onDragStateChange={onStickyDragStateChange}
            onDeleteLink={onDeleteStickyNote}
          />
        )}

        {/* Drop caret indicator */}
        <Box
          sx={{
            position: "fixed",
            left: dropCaret.x,
            top: dropCaret.y,
            width: 2.5,
            height: dropCaret.height,
            bgcolor: "#c4956a",
            borderRadius: 1,
            boxShadow: "0 0 8px rgba(196, 149, 106, 0.6), 0 0 2px rgba(196, 149, 106, 0.9)",
            opacity: dropCaret.visible ? 1 : 0,
            transition: "opacity 100ms ease",
            pointerEvents: "none",
            zIndex: 1500,
          }}
        />


        {/* Editor content area */}
        <EditorContentArea
          editorRef={editorRef}
          editorFontScale={editorFontScale}
          handleEditorKeyDown={handleEditorKeyDown}
          handleInput={handleInput}
          handleBlur={handleBlur}
          handleMouseUp={handleMouseUp}
          handleKeyUp={handleKeyUp}
          handleClick={handleClick}
          onEditorDoubleClick={onEditorDoubleClick}
          onEditorMouseMove={onEditorMouseMove}
          onEditorMouseLeave={onEditorMouseLeave}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleEditorScroll={handleEditorScroll}
          handlePaste={handlePaste}
        />

        <TableControlsOverlay
          editorRef={editorRef}
          onTableChange={handleWrappedEditorInput}
        />

        {/* Grammar overlay */}
        {grammarEnabled && (
          <GrammarOverlay
            mappedLints={mappedLints}
            applySuggestion={applySuggestion}
            editorRef={editorRef}
            scrollTop={editorScrollState.scrollTop}
          />
        )}
        {/* Slash command menu */}
        <SlashCommandMenu
          slashMenu={slashMenu}
          activeSuggestions={activeSuggestions}
          applySlashSuggestion={applySlashSuggestion}
        />

        {/* Token menu */}
        <TokenMenu
          tokenMenu={tokenMenu}
          activeTokenSuggestions={activeTokenSuggestions}
          applyTokenSuggestion={applyTokenSuggestion}
          closeTokenMenu={closeTokenMenu}
          onOpenCustomization={onOpenCustomization}
        />
      </Box>
    </Box>
  );
}
