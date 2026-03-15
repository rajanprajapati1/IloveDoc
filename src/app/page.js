"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Drawer, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import DocbookEditorSurface from "@/components/docbook/DocbookEditorSurface";
import DocbookOverlays from "@/components/docbook/DocbookOverlays";
import DocbookSidebar from "@/components/docbook/DocbookSidebar";
import SettingsPanel from "@/components/docbook/SettingsPanel";
import SelectionPanel from "@/components/docbook/SelectionPanel";
import FeedbackModal from "@/components/docbook/FeedbackModal";
import PricingPanel from "@/components/docbook/PricingPanel";
import WelcomeIntroModal from "@/components/docbook/WelcomeIntroModal";
import {
  buildId,
  createNote,
  createStickyNote,
  defaultNoteContent,
  isExpiredDelete,
  stickyColorOptions,
  uncheckedIconSvg,
  checkedIconSvg,
} from "@/components/docbook/shared";
import { docbookDb } from "../lib/docbookDb";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function Home() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const objectUrlMapRef = useRef({});
  const autoSyncTimerRef = useRef(null);
  const hasHydratedChangeTrackerRef = useRef(false);

  const [notes, setNotes] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState("");
  const [activeStickyNoteId, setActiveStickyNoteId] = useState("");
  const [stickyDragState, setStickyDragState] = useState({ stickyId: "", targetNoteId: "" });
  const [ready, setReady] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState({ visible: false, x: 0, y: 0 });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [linkAnchorEl, setLinkAnchorEl] = useState(null);
  const [fontFamilyAnchorEl, setFontFamilyAnchorEl] = useState(null);
  const [imageAnchorEl, setImageAnchorEl] = useState(null);
  const [listMenuAnchorEl, setListMenuAnchorEl] = useState(null);
  const [noteAnchorEl, setNoteAnchorEl] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [imageMode, setImageMode] = useState("attach");
  const [imageUrlMap, setImageUrlMap] = useState({});
  const [hoverPreview, setHoverPreview] = useState({ visible: false, x: 0, y: 0, url: "", label: "" });

  /* Settings & Selection Panel state */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectionPanelOpen, setSelectionPanelOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [welcomeIntroOpen, setWelcomeIntroOpen] = useState(false);
  const [selectionContent, setSelectionContent] = useState("");
  const [syncBadgeState, setSyncBadgeState] = useState({
    enabled: false,
    hasPin: false,
    interval: 0,
    lastSyncAt: "",
    lastLocalChangeAt: "",
  });

  const activeNotes = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);
  const deletedNotes = useMemo(() => notes.filter((note) => note.deletedAt && !isExpiredDelete(note.deletedAt)), [notes]);
  const activeNote = useMemo(() => activeNotes.find((note) => note.id === activeNoteId) || activeNotes[0] || null, [activeNotes, activeNoteId]);
  const activeNoteStickyNotes = useMemo(() => stickyNotes.filter((note) => note.noteId === activeNoteId), [stickyNotes, activeNoteId]);
  const activeNoteTint = activeNote?.color || "#F7E36D";

  const refreshSyncBadgeState = useCallback((overrides = {}) => {
    try {
      const stored = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
      setSyncBadgeState((prev) => ({
        enabled: Boolean(stored.autoSyncEnabled),
        hasPin: Boolean(stored.pin),
        interval: Number(stored.autoSyncInterval) || 0,
        lastSyncAt: stored.lastSyncAt || prev.lastSyncAt || "",
        lastLocalChangeAt: prev.lastLocalChangeAt,
        ...overrides,
      }));
    } catch {
      setSyncBadgeState((prev) => ({
        ...prev,
        enabled: false,
        hasPin: false,
        interval: 0,
        ...overrides,
      }));
    }
  }, []);

  const hideSelectionMenu = useCallback(() => {
    setSelectionMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const hideHoverPreview = useCallback(() => {
    setHoverPreview((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const captureSelectionRange = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const commonNode =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;

    if (!commonNode || !editor.contains(commonNode)) return null;

    savedSelectionRangeRef.current = range.cloneRange();
    return savedSelectionRangeRef.current;
  }, []);

  const restoreSelectionRange = useCallback(() => {
    const range = savedSelectionRangeRef.current;
    const selection = window.getSelection();
    if (!range || !selection) return false;

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }, []);

  const updateSelectionMenuPosition = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionMenu();
      return;
    }

    const range = selection.getRangeAt(0);
    const commonNode =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;

    if (!commonNode || !editor.contains(commonNode)) {
      hideSelectionMenu();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) {
      hideSelectionMenu();
      return;
    }

    setSelectionMenu((prev) => {
      const next = { visible: true, x: rect.left + rect.width / 2, y: Math.max(16, rect.top - 12) };
      if (prev.visible && Math.abs(prev.x - next.x) < 1 && Math.abs(prev.y - next.y) < 1) return prev;
      return next;
    });
  }, [hideSelectionMenu]);

  const updateCurrentNote = useCallback(
    (updater) => {
      if (!activeNoteId) return;
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== activeNoteId) return note;
          const next = updater(note);
          if (
            next.title === note.title &&
            next.content === note.content &&
            next.color === note.color &&
            next.fontScale === note.fontScale
          ) {
            return note;
          }
          return next;
        })
      );
    },
    [activeNoteId]
  );

  const syncEditorHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    /* Strip zero-width spaces used for caret escaping */
    const html = editor.innerHTML.replace(/\u200B/g, "");
    updateCurrentNote((note) => ({ ...note, content: html }));

    /* Clean up orphaned images: find which IDs are still in the DOM */
    const imgSpans = editor.querySelectorAll("[data-img-ref]");
    const activeIds = new Set();
    imgSpans.forEach((span) => {
      const id = span.getAttribute("data-img-ref");
      if (id) activeIds.add(id);
    });

    /* Remove images from IndexedDB and URL map that are no longer referenced */
    const currentMap = objectUrlMapRef.current;
    const orphanedIds = Object.keys(currentMap).filter((id) => !activeIds.has(id));

    if (orphanedIds.length > 0) {
      orphanedIds.forEach((id) => {
        URL.revokeObjectURL(currentMap[id]);
        delete currentMap[id];
        docbookDb.images.delete(id).catch(() => { });
      });
      objectUrlMapRef.current = { ...currentMap };
      setImageUrlMap({ ...currentMap });
    }
  }, [updateCurrentNote]);

  const runCommand = useCallback(
    (command, value = null) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
    },
    [syncEditorHtml, updateSelectionMenuPosition]
  );

  const refreshActiveNoteImages = useCallback(async (noteId) => {
    if (!noteId) {
      Object.values(objectUrlMapRef.current).forEach((url) => URL.revokeObjectURL(url));
      objectUrlMapRef.current = {};
      setImageUrlMap({});
      return;
    }

    const records = await docbookDb.images.where("noteId").equals(noteId).toArray();
    const next = {};

    for (const record of records) {
      next[record.id] = objectUrlMapRef.current[record.id] || URL.createObjectURL(record.blob);
    }

    for (const [id, url] of Object.entries(objectUrlMapRef.current)) {
      if (!next[id]) URL.revokeObjectURL(url);
    }

    objectUrlMapRef.current = next;
    setImageUrlMap(next);
  }, []);

  const saveCurrentNote = useCallback(async () => {
    if (!activeNoteId) return;

    const now = new Date().toISOString();
    let snapshot = null;
    let nextActive = "";

    setNotes((prev) => {
      const current = prev.find((note) => note.id === activeNoteId);
      if (!current) return prev;

      const saved = {
        ...current,
        title: current.title?.trim() || "Untitled",
        updatedAt: now,
      };

      const next = [saved, ...prev.filter((note) => note.id !== activeNoteId)];
      snapshot = next;
      nextActive = saved.id;
      return next;
    });

    if (snapshot) {
      await docbookDb.notes.bulkPut(snapshot);
      await docbookDb.meta.put({ key: "activeNoteId", value: nextActive });
    }
  }, [activeNoteId]);

  const createNewNote = useCallback(async () => {
    const fresh = createNote({ content: "<p></p>" });
    setNotes((prev) => [fresh, ...prev]);
    setActiveNoteId(fresh.id);
    hideSelectionMenu();
    await docbookDb.notes.put(fresh);
    await docbookDb.meta.put({ key: "activeNoteId", value: fresh.id });
  }, [hideSelectionMenu]);

  const createNewStickyNote = useCallback(async () => {
    if (!activeNoteId) return null;

    const offset = activeNoteStickyNotes.length;
    const fresh = createStickyNote(activeNoteId, {
      x: 150 + (offset % 3) * 18,
      y: 160 + (offset % 4) * 22,
    });

    setStickyNotes((prev) => [...prev, fresh]);
    setActiveStickyNoteId(fresh.id);
    await docbookDb.stickyNotes.put(fresh);
    return fresh;
  }, [activeNoteId, activeNoteStickyNotes.length]);

  const openStickyNote = useCallback((stickyId) => {
    setActiveStickyNoteId(stickyId);
  }, []);

  const updateStickyNote = useCallback(async (stickyId, updates) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === stickyId ? { ...note, ...updates } : note))
    );
    await docbookDb.stickyNotes.update(stickyId, updates);
  }, []);

  const moveStickyNoteToNote = useCallback(async (stickyId, noteId, updates = {}) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === stickyId ? { ...note, noteId, ...updates } : note))
    );
    setShowDeleted(false);
    setActiveNoteId(noteId);
    setActiveStickyNoteId(stickyId);
    setStickyDragState({ stickyId: "", targetNoteId: "" });
    await docbookDb.stickyNotes.update(stickyId, { noteId, ...updates });
  }, []);

  const deleteStickyNote = useCallback(async (stickyId) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== stickyId));
    setActiveStickyNoteId((prev) => (prev === stickyId ? "" : prev));
    await docbookDb.stickyNotes.delete(stickyId);
  }, []);

  const deleteNote = useCallback(
    async (noteId) => {
      if (activeNotes.length <= 1) return;

      const now = new Date().toISOString();
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, deletedAt: now } : note))
      );

      if (noteId === activeNoteId) {
        const remaining = activeNotes.filter((n) => n.id !== noteId);
        setActiveNoteId(remaining[0]?.id || "");
      }

      if (activeNoteId === noteId) {
        setActiveStickyNoteId("");
      }

      hideSelectionMenu();
      hideHoverPreview();

      await docbookDb.notes.update(noteId, { deletedAt: now });
    },
    [activeNotes, activeNoteId, hideSelectionMenu, hideHoverPreview]
  );

  const restoreNote = useCallback(
    async (noteId) => {
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, deletedAt: null } : note))
      );
      await docbookDb.notes.update(noteId, { deletedAt: null });
    },
    []
  );

  const permanentlyDeleteNote = useCallback(
    async (noteId) => {
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setStickyNotes((prev) => prev.filter((note) => note.noteId !== noteId));
      setActiveStickyNoteId((prev) => (stickyNotes.some((note) => note.id === prev && note.noteId === noteId) ? "" : prev));
      await docbookDb.transaction("rw", docbookDb.notes, docbookDb.images, docbookDb.stickyNotes, async () => {
        await docbookDb.notes.delete(noteId);
        await docbookDb.images.where("noteId").equals(noteId).delete();
        await docbookDb.stickyNotes.where("noteId").equals(noteId).delete();
      });
    },
    [stickyNotes]
  );

  const attachImageToSelection = useCallback(
    async (file) => {
      if (!activeNoteId || !file) return;

      const imageId = buildId();
      await docbookDb.images.put({
        id: imageId,
        noteId: activeNoteId,
        blob: file,
        name: file.name,
        mimeType: file.type || "image/*",
        createdAt: new Date().toISOString(),
      });

      const nextMap = { ...objectUrlMapRef.current, [imageId]: URL.createObjectURL(file) };
      objectUrlMapRef.current = nextMap;
      setImageUrlMap(nextMap);

      restoreSelectionRange();
      const selection = window.getSelection();
      const editor = editorRef.current;
      if (!selection || !editor || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const commonNode =
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentNode
          : range.commonAncestorContainer;

      if (!commonNode || !editor.contains(commonNode)) return;

      const hasSelection = !selection.isCollapsed;
      const label = hasSelection ? range.toString().trim() : file.name || "image";

      const token = document.createElement("span");
      token.setAttribute("data-img-ref", imageId);
      token.setAttribute("data-img-label", label || "image");

      if (imageMode === "insert" || !hasSelection) {
        /* Insert mode or no selection — put a 📷 token at cursor */
        token.textContent = "📷";
        range.collapse(false);
        range.insertNode(token);
      } else {
        /* Attach mode with selection — WRAP the text, keep it visible with green dot */
        try {
          range.surroundContents(token);
        } catch {
          const fragment = range.extractContents();
          token.appendChild(fragment);
          range.insertNode(token);
        }
      }

      const after = document.createRange();
      after.setStartAfter(token);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);

      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
    },
    [activeNoteId, imageMode, restoreSelectionRange, syncEditorHtml, updateSelectionMenuPosition]
  );

  const handleEditorSelectionChange = useCallback(() => {
    captureSelectionRange();
    updateSelectionMenuPosition();
  }, [captureSelectionRange, updateSelectionMenuPosition]);

  const handleEditorClick = useCallback(
    (event) => {
      /* Double-click on highlight → remove the highlight */
      if (event.detail === 2) {
        const highlightSpan = event.target.closest?.("[data-highlight]");
        if (highlightSpan && editorRef.current?.contains(highlightSpan)) {
          const parent = highlightSpan.parentNode;
          while (highlightSpan.firstChild) parent.insertBefore(highlightSpan.firstChild, highlightSpan);
          parent.removeChild(highlightSpan);
          parent.normalize();
          syncEditorHtml();
          return;
        }
      }

      /* Handle Todo checkbox click */
      const todoCheckbox = event.target.closest?.("[data-todo-checkbox]");
      if (todoCheckbox && editorRef.current?.contains(todoCheckbox)) {
        event.preventDefault();
        const todoDiv = todoCheckbox.closest("[data-todo]");
        if (todoDiv) {
          const isChecked = todoDiv.getAttribute("data-todo") === "true";
          todoDiv.setAttribute("data-todo", isChecked ? "false" : "true");
          todoCheckbox.innerHTML = isChecked ? uncheckedIconSvg : checkedIconSvg;

          const textContainer = todoDiv.querySelector("div[style*='flex: 1']");
          if (textContainer) {
            textContainer.style.textDecoration = isChecked ? "none" : "line-through";
            textContainer.style.opacity = isChecked ? "1" : "0.6";
          }
          syncEditorHtml();
        }
        return;
      }

      const noteSpan = event.target.closest?.("[data-note-ref]");
      if (noteSpan && editorRef.current?.contains(noteSpan)) {
        const noteText = noteSpan.getAttribute("data-note-text") || "";
        setHoverPreview({ visible: true, x: event.clientX, y: event.clientY - 60, url: "", label: noteText });
        setTimeout(() => hideHoverPreview(), 3000);
      }
    },
    [hideHoverPreview, syncEditorHtml]
  );

  /* Removed hover image preview per user request - handle only note refs on move */
  const handleEditorMouseMove = useCallback(
    (event) => {
      const noteTarget = event.target.closest?.("[data-note-ref]");
      if (noteTarget) {
        const noteText = noteTarget.getAttribute("data-note-text") || "";
        setHoverPreview({ visible: true, x: event.clientX + 18, y: event.clientY + 18, url: "", label: `Note: ${noteText}` });
        return;
      }

      hideHoverPreview();
    },
    [hideHoverPreview]
  );

  const handleEditorDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleEditorDragLeave = useCallback(() => {
    /* no-op — editor surface handles visuals internally */
  }, []);

  const handleEditorDrop = useCallback(
    async (event) => {
      event.preventDefault();

      const editor = editorRef.current;
      if (!editor) return;

      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (range) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.type.startsWith("image/")) {
            const imageId = buildId();
            await docbookDb.images.put({
              id: imageId,
              noteId: activeNoteId,
              blob: file,
              name: file.name,
              mimeType: file.type || "image/*",
              createdAt: new Date().toISOString(),
            });
            const nextMap = { ...objectUrlMapRef.current, [imageId]: URL.createObjectURL(file) };
            objectUrlMapRef.current = nextMap;
            setImageUrlMap(nextMap);
          }
        }
        return;
      }

      const droppedUrl = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
      if (droppedUrl && /^https?:\/\//i.test(droppedUrl.trim())) {
        const url = droppedUrl.trim();
        const linkEl = document.createElement("a");
        linkEl.href = url;
        linkEl.textContent = url;
        linkEl.target = "_blank";
        linkEl.rel = "noopener noreferrer";

        if (range) {
          range.insertNode(linkEl);
          const after = document.createRange();
          after.setStartAfter(linkEl);
          after.collapse(true);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(after);
        }

        syncEditorHtml();
        return;
      }

      const droppedText = event.dataTransfer.getData("text/plain");
      if (droppedText) {
        document.execCommand("insertText", false, droppedText);
        syncEditorHtml();
      }
    },
    [activeNoteId, syncEditorHtml]
  );

  const handleHighlight = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const parentHighlight =
      range.startContainer.nodeType === 3
        ? range.startContainer.parentElement?.closest("[data-highlight]")
        : range.startContainer.closest?.("[data-highlight]");

    if (parentHighlight && editorRef.current?.contains(parentHighlight)) {
      const parent = parentHighlight.parentNode;
      while (parentHighlight.firstChild) parent.insertBefore(parentHighlight.firstChild, parentHighlight);
      parent.removeChild(parentHighlight);
      parent.normalize();
      syncEditorHtml();
      return;
    }

    const highlightSpan = document.createElement("span");
    highlightSpan.setAttribute("data-highlight", "true");

    try {
      range.surroundContents(highlightSpan);
    } catch {
      const fragment = range.extractContents();
      highlightSpan.appendChild(fragment);
      range.insertNode(highlightSpan);
    }

    selection.removeAllRanges();

    const afterRange = document.createRange();
    afterRange.setStartAfter(highlightSpan);
    afterRange.collapse(true);
    selection.addRange(afterRange);

    syncEditorHtml();
    window.requestAnimationFrame(updateSelectionMenuPosition);
  }, [syncEditorHtml, updateSelectionMenuPosition]);

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll("[data-highlight], [data-note-ref]").forEach((element) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.intersectsNode(element)) {
          const parent = element.parentNode;
          while (element.firstChild) parent.insertBefore(element.firstChild, element);
          parent.removeChild(element);
          parent.normalize();
        }
      });
    }

    runCommand("removeFormat");
  }, [runCommand]);

  const handleInsertTodo = useCallback(() => {
    restoreSelectionRange();
    const selection = window.getSelection();
    let contentHtml = "<br>";

    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const clone = range.cloneContents();
      const div = document.createElement("div");
      div.appendChild(clone);
      contentHtml = div.innerHTML || "<br>";
    }

    const todoHtml = `<div data-todo="false" style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span data-todo-checkbox="true" style="cursor: pointer; color: #8b5e3c; display: flex; align-items: center; justify-content: center; user-select: none;" contenteditable="false">${uncheckedIconSvg}</span><div style="flex: 1; outline: none; min-width: 50px;">${contentHtml}</div></div><p><br></p>`;
    document.execCommand("insertHTML", false, todoHtml);
    syncEditorHtml();
  }, [restoreSelectionRange, syncEditorHtml]);

  const handleInsertTable = useCallback(() => {
    restoreSelectionRange();
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0;"><tbody><tr><th style="border: 1px solid #d9cab7; padding: 10px 6px; min-width: 50px; background-color: #f1ebd8; font-weight: bold; text-align: left;"><br></th><th style="border: 1px solid #d9cab7; padding: 10px 6px; min-width: 50px; background-color: #f1ebd8; font-weight: bold; text-align: left;"><br></th><th style="border: 1px solid #d9cab7; padding: 10px 6px; min-width: 50px; background-color: #f1ebd8; font-weight: bold; text-align: left;"><br></th></tr><tr><td style="border: 1px solid #d9cab7; padding: 6px; min-width: 50px;"><br></td><td style="border: 1px solid #d9cab7; padding: 6px; min-width: 50px;"><br></td><td style="border: 1px solid #d9cab7; padding: 6px; min-width: 50px;"><br></td></tr></tbody></table><p><br></p>`;
    document.execCommand("insertHTML", false, tableHtml);
    syncEditorHtml();
  }, [restoreSelectionRange, syncEditorHtml]);

  const handleFontFamilyChange = useCallback((fontFamily) => {
    restoreSelectionRange();
    document.execCommand("fontName", false, fontFamily);
    syncEditorHtml();
  }, [restoreSelectionRange, syncEditorHtml]);

  const handleFontSizeIncrease = useCallback(() => {
    restoreSelectionRange();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      updateCurrentNote((note) => ({ ...note, fontScale: clamp((note.fontScale || 1) + 0.08, 0.72, 1.55) }));
      return;
    }

    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = "larger";
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const after = document.createRange();
    after.setStartAfter(span);
    after.collapse(true);
    sel.addRange(after);
    syncEditorHtml();
    window.requestAnimationFrame(updateSelectionMenuPosition);
  }, [restoreSelectionRange, syncEditorHtml, updateCurrentNote, updateSelectionMenuPosition]);

  const handleFontSizeDecrease = useCallback(() => {
    restoreSelectionRange();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      updateCurrentNote((note) => ({ ...note, fontScale: clamp((note.fontScale || 1) - 0.08, 0.72, 1.55) }));
      return;
    }

    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = "smaller";
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const after = document.createRange();
    after.setStartAfter(span);
    after.collapse(true);
    sel.addRange(after);
    syncEditorHtml();
    window.requestAnimationFrame(updateSelectionMenuPosition);
  }, [restoreSelectionRange, syncEditorHtml, updateCurrentNote, updateSelectionMenuPosition]);

  /* Handle paste image from clipboard (PrtSc, Ctrl+V with image) */
  const handlePasteImage = useCallback(
    async (file) => {
      if (!activeNoteId || !file) return;

      const imageId = buildId();
      const fileName = file.name || `screenshot-${Date.now()}.png`;

      await docbookDb.images.put({
        id: imageId,
        noteId: activeNoteId,
        blob: file,
        name: fileName,
        mimeType: file.type || "image/png",
        createdAt: new Date().toISOString(),
      });

      const nextMap = { ...objectUrlMapRef.current, [imageId]: URL.createObjectURL(file) };
      objectUrlMapRef.current = nextMap;
      setImageUrlMap(nextMap);

      const selection = window.getSelection();
      const editor = editorRef.current;
      if (!selection || !editor || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const commonNode =
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentNode
          : range.commonAncestorContainer;

      if (!commonNode || !editor.contains(commonNode)) return;

      const hasSelection = !selection.isCollapsed;
      const label = hasSelection ? range.toString().trim() : fileName;

      const token = document.createElement("span");
      token.setAttribute("data-img-ref", imageId);
      token.setAttribute("data-img-label", label || "image");

      if (hasSelection) {
        /* WRAP the selected text — keep it visible, just add the img-ref span around it */
        try {
          range.surroundContents(token);
        } catch {
          /* If surroundContents fails (cross-element selection), extract and re-insert */
          const fragment = range.extractContents();
          token.appendChild(fragment);
          range.insertNode(token);
        }
      } else {
        /* No selection — insert a camera emoji token at cursor */
        token.textContent = "📷";
        range.collapse(false);
        range.insertNode(token);
      }

      /* Move cursor after the token */
      const after = document.createRange();
      after.setStartAfter(token);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);

      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
    },
    [activeNoteId, syncEditorHtml, updateSelectionMenuPosition]
  );

  /* Open selection panel with current selection content */
  const handleOpenSelectionPanel = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);
      setSelectionContent(tempDiv.innerHTML);
    } else {
      setSelectionContent("");
    }
    setSelectionPanelOpen(true);
  }, []);

  /* Import notes from cloud */
  const handleImportNotes = useCallback(async (cloudNotes) => {
    if (!cloudNotes || cloudNotes.length === 0) return;

    setNotes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newNotes = [];
      const updatedPrev = [...prev];

      for (const cloudNote of cloudNotes) {
        if (existingIds.has(cloudNote.id)) {
          /* Update existing note if cloud version is newer */
          const idx = updatedPrev.findIndex((n) => n.id === cloudNote.id);
          if (idx !== -1 && new Date(cloudNote.updatedAt) > new Date(updatedPrev[idx].updatedAt)) {
            updatedPrev[idx] = { ...updatedPrev[idx], ...cloudNote };
          }
        } else {
          newNotes.push(cloudNote);
        }
      }

      return [...newNotes, ...updatedPrev];
    });

    /* Persist to IndexedDB */
    await docbookDb.notes.bulkPut(cloudNotes);
  }, []);

  /* ─── Bootstrap ─── */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      let shouldShowWelcomeIntro = false;
      let storedNotes = await docbookDb.notes.orderBy("updatedAt").reverse().toArray();
      let storedStickyNotes = await docbookDb.stickyNotes.toArray();

      /* Purge notes that were soft-deleted more than 7 days ago */
      const expiredIds = storedNotes.filter((n) => isExpiredDelete(n.deletedAt)).map((n) => n.id);
      if (expiredIds.length > 0) {
        await docbookDb.transaction("rw", docbookDb.notes, docbookDb.images, async () => {
          for (const id of expiredIds) {
            await docbookDb.notes.delete(id);
            await docbookDb.images.where("noteId").equals(id).delete();
          }
        });
        storedNotes = storedNotes.filter((n) => !expiredIds.includes(n.id));
      }

      /* Filter to only active notes for the initial view */
      const liveNotes = storedNotes.filter((n) => !n.deletedAt);
      if (liveNotes.length === 0) {
        shouldShowWelcomeIntro = true;
        const first = createNote({
          title: "Welcome to DocBook",
          content: defaultNoteContent,
        });
        const starterStickyNotes = [
          createStickyNote(first.id, {
            title: "Quick Ideas",
            content: "Capture loose thoughts here before they disappear.",
            color: stickyColorOptions[3].value,
            x: 170,
            y: 100,
          }),

          createStickyNote(first.id, {
            title: "Today",
            content: "Use this one for the one or two things you need to finish today.",
            color: stickyColorOptions[4].value,
            x: 1170,
            y: 120,
          }),

          createStickyNote(first.id, {
            title: "Keep Nearby",
            content: "Pin reminders, links, or short reference notes next to your page.",
            color: stickyColorOptions[2].value,
            x: 220,
            y: 300,
          }),

          createStickyNote(first.id, {
            title: "Checklist",
            content: "Add next steps, follow-ups, or small tasks you want in sight.",
            color: stickyColorOptions[5].value,
            x: 1300,
            y: 250,
          }),
        ];

        await docbookDb.notes.put(first);
        await docbookDb.stickyNotes.bulkPut(starterStickyNotes);
        storedNotes = [...storedNotes, first];
        storedStickyNotes = starterStickyNotes;
      }

      const activeMeta = await docbookDb.meta.get("activeNoteId");
      const preferred = activeMeta?.value;
      const availableNotes = storedNotes.filter((n) => !n.deletedAt);
      const initialActiveId = availableNotes.some((note) => note.id === preferred) ? preferred : availableNotes[0]?.id || "";

      if (cancelled) return;

      setNotes(storedNotes);
      setStickyNotes(storedStickyNotes);
      setActiveNoteId(initialActiveId);
      setReady(true);
      setWelcomeIntroOpen(shouldShowWelcomeIntro);
      await docbookDb.meta.put({ key: "activeNoteId", value: initialActiveId });
    };

    void bootstrap();

    return () => {
      cancelled = true;
      Object.values(objectUrlMapRef.current).forEach((url) => URL.revokeObjectURL(url));
      objectUrlMapRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!ready || !activeNoteId) return;
    void docbookDb.meta.put({ key: "activeNoteId", value: activeNoteId });
  }, [ready, activeNoteId]);

  useEffect(() => {
    refreshSyncBadgeState();

    const handleSyncSettingsChanged = () => refreshSyncBadgeState();
    const handleStorage = (event) => {
      if (event.key === "docbook_sync_settings") {
        refreshSyncBadgeState();
      }
    };

    window.addEventListener("docbook-sync-settings-changed", handleSyncSettingsChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("docbook-sync-settings-changed", handleSyncSettingsChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshSyncBadgeState]);

  useEffect(() => {
    if (!ready || notes.length === 0) return;
    const timeoutId = setTimeout(() => {
      void docbookDb.notes.bulkPut(notes);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [ready, notes]);

  useEffect(() => {
    if (!ready) return;
    const timeoutId = setTimeout(() => {
      void docbookDb.stickyNotes.bulkPut(stickyNotes);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [ready, stickyNotes]);

  useEffect(() => {
    if (!ready) return;
    if (!hasHydratedChangeTrackerRef.current) {
      hasHydratedChangeTrackerRef.current = true;
      return;
    }

    setSyncBadgeState((prev) => ({
      ...prev,
      lastLocalChangeAt: new Date().toISOString(),
    }));
  }, [ready, notes, stickyNotes]);

  useEffect(() => {
    if (!activeNote && activeNotes.length > 0) setActiveNoteId(activeNotes[0].id);
  }, [activeNote, notes]);

  useEffect(() => {
    if (!activeNoteId) {
      setActiveStickyNoteId("");
      return;
    }

    const currentStickyNotes = stickyNotes.filter((note) => note.noteId === activeNoteId);
    if (currentStickyNotes.length === 0) {
      setActiveStickyNoteId("");
      return;
    }

    if (!currentStickyNotes.some((note) => note.id === activeStickyNoteId)) {
      setActiveStickyNoteId(currentStickyNotes[0].id);
    }
  }, [activeNoteId, activeStickyNoteId, stickyNotes]);

  useEffect(() => {
    if (!editorRef.current || !activeNote) return;
    if (editorRef.current.innerHTML !== activeNote.content) editorRef.current.innerHTML = activeNote.content || "";
  }, [activeNote, activeNoteId]);

  useEffect(() => {
    if (!ready) return;
    void refreshActiveNoteImages(activeNoteId);
  }, [ready, activeNoteId, refreshActiveNoteImages]);

  useEffect(() => {
    const syncSelection = () => window.requestAnimationFrame(updateSelectionMenuPosition);
    document.addEventListener("selectionchange", syncSelection);
    window.addEventListener("resize", syncSelection);
    window.addEventListener("scroll", syncSelection, true);

    return () => {
      document.removeEventListener("selectionchange", syncSelection);
      window.removeEventListener("resize", syncSelection);
      window.removeEventListener("scroll", syncSelection, true);
    };
  }, [updateSelectionMenuPosition]);

  useEffect(() => {
    hideSelectionMenu();
    hideHoverPreview();
  }, [activeNoteId, hideSelectionMenu, hideHoverPreview]);

  /* Keyboard shortcuts: Ctrl+S (save), Ctrl+H (settings) */
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrentNote();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
        event.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveCurrentNote]);

  /* Auto-sync timer */
  useEffect(() => {
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    try {
      const settings = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
      if (settings.autoSyncEnabled && settings.autoSyncInterval > 0 && settings.pin) {
        autoSyncTimerRef.current = setInterval(async () => {
          try {
            const notesToSync = notes.filter((n) => !n.deletedAt).map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
              deletedAt: n.deletedAt || null,
              color: n.color || null,
              fontScale: n.fontScale || 1,
            }));

            await fetch("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin: settings.pin, notes: notesToSync }),
            });

            const now = new Date().toISOString();
            const updated = { ...settings, lastSyncAt: now };
            localStorage.setItem("docbook_sync_settings", JSON.stringify(updated));
            window.dispatchEvent(new Event("docbook-sync-settings-changed"));
            setSyncBadgeState((prev) => ({
              ...prev,
              enabled: Boolean(updated.autoSyncEnabled),
              hasPin: Boolean(updated.pin),
              interval: Number(updated.autoSyncInterval) || 0,
              lastSyncAt: now,
            }));
          } catch { /* silent */ }
        }, settings.autoSyncInterval * 1000);
      }
    } catch { /* silent */ }

    return () => {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    };
  }, [notes, settingsOpen]);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 14% 10%, ${alpha(activeNoteTint, 0.22)} 0%, transparent 22%),
          radial-gradient(circle at 84% 88%, ${alpha(activeNoteTint, 0.14)} 0%, transparent 18%),
          linear-gradient(180deg, rgba(255,252,248,0.98) 0%, rgba(248,243,235,0.98) 100%)
        `,
      }}
    >
      <Paper
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          border: "1px solid #ddd4ca",
          bgcolor: alpha("#f8f5f0", 0.76),
          background: `linear-gradient(180deg, ${alpha(activeNoteTint, 0.08)} 0%, rgba(248,245,240,0.9) 14%, rgba(248,245,240,0.82) 100%)`,
          boxShadow: "0 30px 90px rgba(114, 94, 68, 0.12)",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", md: `${sidebarCollapsed ? 60 : 240}px minmax(0, 1fr)` }, height: "100%", alignItems: "stretch", minHeight: 0, transition: "grid-template-columns 250ms cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <WelcomeIntroModal open={welcomeIntroOpen} onClose={() => setWelcomeIntroOpen(false)} />

          <DocbookSidebar
            notes={activeNotes}
            deletedNotes={deletedNotes}
            activeNoteId={activeNote?.id}
            sidebarTint={activeNoteTint}
            showDeleted={showDeleted}
            stickyDragState={stickyDragState}
            isCollapsed={sidebarCollapsed}
            onToggleDeleted={() => setShowDeleted((prev) => !prev)}
            onCreateNote={() => {
              void createNewNote();
            }}
            onOpenNote={(noteId) => {
              setShowDeleted(false);
              setActiveNoteId(noteId);
            }}
            onDeleteNote={(noteId) => {
              void deleteNote(noteId);
            }}
            onRestoreNote={(noteId) => {
              void restoreNote(noteId);
            }}
            onPermanentlyDelete={(noteId) => {
              void permanentlyDeleteNote(noteId);
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
            onOpenPricing={() => setPricingOpen(true)}
            onExpand={() => setDrawerOpen(true)}
            onImportNotes={handleImportNotes}
          />

          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
              sx: { width: 280, bgcolor: "#faf7f3" }
            }}
            sx={{ display: { xs: "block", lg: "none" } }}
          >
            <DocbookSidebar
              notes={activeNotes}
              deletedNotes={deletedNotes}
              activeNoteId={activeNote?.id}
              sidebarTint={activeNoteTint}
              showDeleted={showDeleted}
              stickyDragState={stickyDragState}
              onToggleDeleted={() => setShowDeleted((prev) => !prev)}
              onCreateNote={() => {
                void createNewNote();
                setDrawerOpen(false);
              }}
              onOpenNote={(noteId) => {
                setShowDeleted(false);
                setActiveNoteId(noteId);
                setDrawerOpen(false);
              }}
              onDeleteNote={(noteId) => {
                void deleteNote(noteId);
              }}
              onRestoreNote={(noteId) => {
                void restoreNote(noteId);
              }}
              onPermanentlyDelete={(noteId) => {
                void permanentlyDeleteNote(noteId);
              }}
              onOpenSettings={() => {
                setSettingsOpen(true);
                setDrawerOpen(false);
              }}
              onOpenFeedback={() => {
                setFeedbackOpen(true);
                setDrawerOpen(false);
              }}
              onOpenPricing={() => {
                setPricingOpen(true);
                setDrawerOpen(false);
              }}
              onImportNotes={handleImportNotes}
              isDrawer={true}
            />
          </Drawer>

          <DocbookEditorSurface
            collapseSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeNote={activeNote}
            editorRef={editorRef}
            imageUrlMap={imageUrlMap}
            stickyNotes={stickyNotes}
            activeStickyNoteId={activeStickyNoteId}
            onTitleChange={(event) => updateCurrentNote((note) => ({ ...note, title: event.target.value }))}
            onNoteColorChange={(color) => updateCurrentNote((note) => ({ ...note, color }))}
            onEditorInput={syncEditorHtml}
            onEditorBlur={syncEditorHtml}
            onEditorSelectionChange={handleEditorSelectionChange}
            onEditorClick={handleEditorClick}
            onEditorMouseMove={handleEditorMouseMove}
            onEditorMouseLeave={hideHoverPreview}
            onEditorDragOver={handleEditorDragOver}
            onEditorDragLeave={handleEditorDragLeave}
            onEditorDrop={handleEditorDrop}
            onOpenSelectionPanel={handleOpenSelectionPanel}
            onPasteImage={handlePasteImage}
            onAddStickyNote={() => {
              void createNewStickyNote();
            }}
            onOpenStickyNote={openStickyNote}
            onUpdateStickyNote={(stickyId, updates) => {
              void updateStickyNote(stickyId, updates);
            }}
            onMoveStickyNote={(stickyId, noteId, updates) => {
              void moveStickyNoteToNote(stickyId, noteId, updates);
            }}
            onStickyDragStateChange={setStickyDragState}
            onDeleteStickyNote={(stickyId) => {
              void deleteStickyNote(stickyId);
            }}
            onFontSizeIncrease={handleFontSizeIncrease}
            onFontSizeDecrease={handleFontSizeDecrease}
            syncBadgeState={syncBadgeState}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: 12, md: 22 },
            bottom: { xs: 12, md: 18 },
            zIndex: 24,
            pointerEvents: "none",
            px: 1.8,
            py: 1.2,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#8d7868",
              mb: 0.15,
            }}
          >
            Made with
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, mb: -0.15 }}>
            <Typography
              sx={{
                fontSize: { xs: 34, md: 40 },
                color: "#241c19",
                fontFamily: "\"Segoe Script\", \"Brush Script MT\", cursive",
              }}
            >
              l
            </Typography>
            <FavoriteRoundedIcon sx={{ fontSize: { xs: 25, md: 29 }, color: "#ff1458", mx: 0.1, mt: 0.15 }} />
            <Typography
              sx={{
                fontSize: { xs: 34, md: 40 },
                color: "#241c19",
                fontFamily: "\"Segoe Script\", \"Brush Script MT\", cursive",
                ml: -0.2,
              }}
            >
              ve
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#8a7464" }}>
            by Rajan
          </Typography>
        </Box>

        <DocbookOverlays
          selectionMenu={selectionMenu}
          captureSelectionRange={captureSelectionRange}
          onHighlight={handleHighlight}
          onClear={handleClear}
          runCommand={runCommand}
          onInsertTodo={handleInsertTodo}
          onInsertTable={handleInsertTable}
          restoreSelectionRange={restoreSelectionRange}
          colorAnchorEl={colorAnchorEl}
          setColorAnchorEl={setColorAnchorEl}
          fontFamilyAnchorEl={fontFamilyAnchorEl}
          setFontFamilyAnchorEl={setFontFamilyAnchorEl}
          changeFontFamily={handleFontFamilyChange}
          onFontSizeIncrease={handleFontSizeIncrease}
          onFontSizeDecrease={handleFontSizeDecrease}
          linkAnchorEl={linkAnchorEl}
          setLinkAnchorEl={setLinkAnchorEl}
          linkDraft={linkDraft}
          setLinkDraft={setLinkDraft}
          imageAnchorEl={imageAnchorEl}
          setImageAnchorEl={setImageAnchorEl}
          setImageMode={setImageMode}
          fileInputRef={fileInputRef}
          listMenuAnchorEl={listMenuAnchorEl}
          setListMenuAnchorEl={setListMenuAnchorEl}
          editorRef={editorRef}
          syncEditorHtml={syncEditorHtml}
          noteAnchorEl={noteAnchorEl}
          setNoteAnchorEl={setNoteAnchorEl}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          buildId={buildId}
          attachImageToSelection={attachImageToSelection}
          hoverPreview={hoverPreview}
          onOpenSelectionPanel={handleOpenSelectionPanel}
        />
      </Paper>

      {/* Settings Panel (Ctrl+H) */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        notes={notes}
        onImportNotes={handleImportNotes}
      />

      {/* Selection & Images Panel */}
      <SelectionPanel
        editorRef={editorRef}
        imageUrlMap={imageUrlMap}
        selectionContent={selectionContent}
        visible={selectionPanelOpen}
        onClose={() => setSelectionPanelOpen(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* Pricing Panel */}
      <PricingPanel
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
      />
    </Box>
  );
}
