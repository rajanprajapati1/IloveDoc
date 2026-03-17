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
  plainTextFromHtml,
  stickyColorOptions,
  uncheckedIconSvg,
  checkedIconSvg,
} from "@/components/docbook/shared";
import { docbookDb } from "../lib/docbookDb";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const highlightBlockSelector = "li, p, div, td, th, blockquote, h1, h2, h3, h4, h5, h6";

export default function Home() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const objectUrlMapRef = useRef({});
  const autoSyncTimerRef = useRef(null);
  const hasHydratedChangeTrackerRef = useRef(false);
  const commandSearchInputRef = useRef(null);

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
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState("");
  const [commandSearchIndex, setCommandSearchIndex] = useState(0);

  const activeNotes = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);
  const deletedNotes = useMemo(() => notes.filter((note) => note.deletedAt && !isExpiredDelete(note.deletedAt)), [notes]);
  const activeNote = useMemo(() => activeNotes.find((note) => note.id === activeNoteId) || activeNotes[0] || null, [activeNotes, activeNoteId]);
  const activeNoteStickyNotes = useMemo(() => stickyNotes.filter((note) => note.noteId === activeNoteId), [stickyNotes, activeNoteId]);
  const activeNoteTint = activeNote?.color || "#F7E36D";
  const commandSearchResults = useMemo(() => {
    const normalized = commandSearchQuery.trim().toLowerCase();
    const sorted = [...activeNotes].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    if (!normalized) return sorted.slice(0, 10);

    return sorted
      .filter((note) => {
        const title = (note.title || "").toLowerCase();
        const contentText = plainTextFromHtml(note.content || "").toLowerCase();
        return title.includes(normalized) || contentText.includes(normalized);
      })
      .slice(0, 30);
  }, [activeNotes, commandSearchQuery]);

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

  const unwrapHighlightSpan = useCallback((highlightSpan) => {
    if (!highlightSpan?.parentNode) return false;

    const parent = highlightSpan.parentNode;
    while (highlightSpan.firstChild) {
      parent.insertBefore(highlightSpan.firstChild, highlightSpan);
    }
    parent.removeChild(highlightSpan);
    parent.normalize();
    return true;
  }, []);

  const getSelectionBlock = useCallback((node, editor) => {
    const element = node?.nodeType === 3 ? node.parentElement : node;
    return element?.closest?.(highlightBlockSelector) || editor;
  }, []);

  const isRangeInsideSingleBlock = useCallback(
    (range) => {
      const editor = editorRef.current;
      if (!editor || !range) return false;

      const startBlock = getSelectionBlock(range.startContainer, editor);
      const endBlock = getSelectionBlock(range.endContainer, editor);
      return Boolean(startBlock && endBlock && startBlock === endBlock);
    },
    [getSelectionBlock]
  );

  const isRangeInsideEditor = useCallback((range) => {
    const editor = editorRef.current;
    if (!editor || !range) return false;

    const commonNode =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;

    return Boolean(commonNode && editor.contains(commonNode));
  }, []);

  const getLiveEditorRange = useCallback(
    (allowCollapsed = true) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      if (!allowCollapsed && range.collapsed) return null;
      return isRangeInsideEditor(range) ? range.cloneRange() : null;
    },
    [isRangeInsideEditor]
  );

  const getSavedEditorRange = useCallback(
    (allowCollapsed = true) => {
      const range = savedSelectionRangeRef.current;
      if (!range) return null;
      if (!allowCollapsed && range.collapsed) return null;
      return isRangeInsideEditor(range) ? range.cloneRange() : null;
    },
    [isRangeInsideEditor]
  );

  const getPreferredEditorRange = useCallback(
    ({ allowCollapsed = true, preferSaved = false, explicitRange = null } = {}) => {
      if (explicitRange) {
        if (!allowCollapsed && explicitRange.collapsed) return null;
        return isRangeInsideEditor(explicitRange) ? explicitRange.cloneRange() : null;
      }

      const getters = preferSaved ? [getSavedEditorRange, getLiveEditorRange] : [getLiveEditorRange, getSavedEditorRange];
      for (const getRange of getters) {
        const range = getRange(allowCollapsed);
        if (range) return range;
      }

      return null;
    },
    [getLiveEditorRange, getSavedEditorRange, isRangeInsideEditor]
  );

  const selectEditorRange = useCallback(
    (range) => {
      const selection = window.getSelection();
      if (!selection || !range || !isRangeInsideEditor(range)) return null;

      const nextRange = range.cloneRange();
      selection.removeAllRanges();
      selection.addRange(nextRange);
      return nextRange;
    },
    [isRangeInsideEditor]
  );

  const persistImageFile = useCallback(
    async (file, fallbackType = "image/*") => {
      const imageId = buildId();
      const fileName = file.name || `image-${Date.now()}.png`;

      await docbookDb.images.put({
        id: imageId,
        noteId: activeNoteId,
        blob: file,
        name: fileName,
        mimeType: file.type || fallbackType,
        createdAt: new Date().toISOString(),
      });

      const nextMap = { ...objectUrlMapRef.current, [imageId]: URL.createObjectURL(file) };
      objectUrlMapRef.current = nextMap;
      setImageUrlMap(nextMap);

      return { imageId, fileName };
    },
    [activeNoteId]
  );

  const removeStoredImage = useCallback(async (imageId) => {
    const currentMap = objectUrlMapRef.current;
    const currentUrl = currentMap[imageId];
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      const nextMap = { ...currentMap };
      delete nextMap[imageId];
      objectUrlMapRef.current = nextMap;
      setImageUrlMap(nextMap);
    }

    await docbookDb.images.delete(imageId).catch(() => { });
  }, []);

  const insertImageTokenAtRange = useCallback(
    ({ range, imageId, label, mode }) => {
      const selection = window.getSelection();
      const activeRange = selectEditorRange(range);
      if (!selection || !activeRange) return false;

      const token = document.createElement("span");
      token.setAttribute("data-img-ref", imageId);
      token.setAttribute("data-img-label", label || "image");

      if (mode === "insert" || activeRange.collapsed) {
        token.textContent = "📷";
        activeRange.collapse(false);
        activeRange.insertNode(token);
      } else {
        try {
          activeRange.surroundContents(token);
        } catch {
          const fragment = activeRange.extractContents();
          token.appendChild(fragment);
          activeRange.insertNode(token);
        }
      }

      const afterRange = document.createRange();
      afterRange.setStartAfter(token);
      afterRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(afterRange);
      savedSelectionRangeRef.current = afterRange.cloneRange();
      return true;
    },
    [selectEditorRange]
  );

  const addImageToEditor = useCallback(
    async (file, { mode = "attach", preferSaved = false, explicitRange = null, fallbackType = "image/*", fallbackLabel = "" } = {}) => {
      if (!activeNoteId || !file) return false;

      const range = getPreferredEditorRange({ allowCollapsed: true, preferSaved, explicitRange });
      if (!range) return false;

      const label = range.toString().trim() || fallbackLabel || file.name || "image";
      const { imageId } = await persistImageFile(file, fallbackType);

      if (!insertImageTokenAtRange({ range, imageId, label, mode })) {
        await removeStoredImage(imageId);
        return false;
      }

      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
      return true;
    },
    [activeNoteId, getPreferredEditorRange, insertImageTokenAtRange, persistImageFile, removeStoredImage]
  );

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
      restoreSelectionRange();
      await addImageToEditor(file, { mode: imageMode, preferSaved: true });
      return;

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
    [activeNoteId, addImageToEditor, imageMode, restoreSelectionRange, syncEditorHtml, updateSelectionMenuPosition]
  );

  const handleEditorSelectionChange = useCallback(() => {
    captureSelectionRange();
    updateSelectionMenuPosition();
  }, [captureSelectionRange, updateSelectionMenuPosition]);

  const handleEditorClick = useCallback(
    (event) => {
      /* Double-click on highlight → remove the highlight */
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
        return;
      }

      const mentionSpan = event.target.closest?.("[data-user-mention]");
      if (mentionSpan && editorRef.current?.contains(mentionSpan)) {
        const handle = mentionSpan.getAttribute("data-user-handle") || "";
        const name = mentionSpan.getAttribute("data-user-name") || "";
        const role = mentionSpan.getAttribute("data-user-role") || "";
        setHoverPreview({
          visible: true,
          x: event.clientX,
          y: event.clientY - 60,
          url: "",
          label: `${name}${handle ? ` (@${handle})` : ""}${role ? `\n${role}` : ""}`,
        });
        setTimeout(() => hideHoverPreview(), 3000);
        return;
      }

      const folderSpan = event.target.closest?.("[data-folder-ref]");
      if (folderSpan && editorRef.current?.contains(folderSpan)) {
        const path = folderSpan.getAttribute("data-folder-path") || "";
        const description = folderSpan.getAttribute("data-folder-description") || "";
        setHoverPreview({
          visible: true,
          x: event.clientX,
          y: event.clientY - 60,
          url: "",
          label: `${path}${description ? `\n${description}` : ""}`,
        });
        setTimeout(() => hideHoverPreview(), 3000);
      }
    },
    [hideHoverPreview, syncEditorHtml]
  );

  const handleEditorDoubleClick = useCallback(
    (event) => {
      const highlightSpan = event.target.closest?.("[data-highlight]");
      if (!highlightSpan || !editorRef.current?.contains(highlightSpan)) return;

      event.preventDefault();
      event.stopPropagation();
      window.getSelection()?.removeAllRanges();

      if (unwrapHighlightSpan(highlightSpan)) {
        hideSelectionMenu();
        syncEditorHtml();
      }
    },
    [hideSelectionMenu, syncEditorHtml, unwrapHighlightSpan]
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

      const mentionTarget = event.target.closest?.("[data-user-mention]");
      if (mentionTarget) {
        const handle = mentionTarget.getAttribute("data-user-handle") || "";
        const name = mentionTarget.getAttribute("data-user-name") || "";
        const role = mentionTarget.getAttribute("data-user-role") || "";
        setHoverPreview({
          visible: true,
          x: event.clientX + 18,
          y: event.clientY + 18,
          url: "",
          label: `${name}${handle ? ` (@${handle})` : ""}${role ? `\n${role}` : ""}`,
        });
        return;
      }

      const folderTarget = event.target.closest?.("[data-folder-ref]");
      if (folderTarget) {
        const path = folderTarget.getAttribute("data-folder-path") || "";
        const description = folderTarget.getAttribute("data-folder-description") || "";
        setHoverPreview({
          visible: true,
          x: event.clientX + 18,
          y: event.clientY + 18,
          url: "",
          label: `${path}${description ? `\n${description}` : ""}`,
        });
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
        let nextRange = range ? range.cloneRange() : getPreferredEditorRange({ allowCollapsed: true });
        let handledImageDrop = false;

        for (const file of files) {
          if (!file.type.startsWith("image/")) continue;

          handledImageDrop = true;
          const inserted = await addImageToEditor(file, {
            mode: "insert",
            explicitRange: nextRange,
            fallbackLabel: file.name || "image",
          });

          if (inserted) {
            nextRange = getPreferredEditorRange({ allowCollapsed: true });
          }
        }

        if (handledImageDrop) return;

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
    [activeNoteId, addImageToEditor, getPreferredEditorRange, syncEditorHtml]
  );

  const handleHighlight = useCallback(() => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || !editor || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const commonNode =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;

    if (!commonNode || !editor.contains(commonNode) || !isRangeInsideSingleBlock(range)) return;

    const parentHighlight =
      range.startContainer.nodeType === 3
        ? range.startContainer.parentElement?.closest("[data-highlight]")
        : range.startContainer.closest?.("[data-highlight]");

    if (parentHighlight && editor.contains(parentHighlight)) {
      unwrapHighlightSpan(parentHighlight);
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
  }, [isRangeInsideSingleBlock, syncEditorHtml, unwrapHighlightSpan, updateSelectionMenuPosition]);

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll("[data-highlight], [data-note-ref], [data-user-mention], [data-folder-ref]").forEach((element) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.intersectsNode(element)) {
          const parent = element.parentNode;
          if (element.hasAttribute("data-user-mention")) {
            const handle = element.getAttribute("data-user-handle") || "";
            parent.insertBefore(document.createTextNode(handle ? `@${handle}` : ""), element);
            parent.removeChild(element);
            parent.normalize();
            return;
          }
          if (element.hasAttribute("data-folder-ref")) {
            const path = element.getAttribute("data-folder-path") || "";
            parent.insertBefore(document.createTextNode(path ? `#${path}` : ""), element);
            parent.removeChild(element);
            parent.normalize();
            return;
          }
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

  const handleNoteFontScaleIncrease = useCallback(() => {
    updateCurrentNote((note) => ({ ...note, fontScale: clamp((note.fontScale || 1) + 0.08, 0.72, 1.55) }));
  }, [updateCurrentNote]);

  const handleNoteFontScaleDecrease = useCallback(() => {
    updateCurrentNote((note) => ({ ...note, fontScale: clamp((note.fontScale || 1) - 0.08, 0.72, 1.55) }));
  }, [updateCurrentNote]);

  /* Handle paste image from clipboard (PrtSc, Ctrl+V with image) */
  const handlePasteImage = useCallback(
    async (file) => {
      const fallbackImageLabel = file?.name || `screenshot-${Date.now()}.png`;
      await addImageToEditor(file, {
        mode: "attach",
        fallbackType: "image/png",
        fallbackLabel: fallbackImageLabel,
      });
      return;

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
    [activeNoteId, addImageToEditor, syncEditorHtml, updateSelectionMenuPosition]
  );

  /* Open selection panel with current selection content */
  const handleOpenSelectionPanel = useCallback(() => {
    const range = getPreferredEditorRange({ allowCollapsed: false, preferSaved: true });
    if (range) {
      const fragment = range.cloneContents();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);
      setSelectionContent(tempDiv.innerHTML);
    } else {
      setSelectionContent("");
    }
    setSelectionPanelOpen(true);
  }, [getPreferredEditorRange]);

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

  useEffect(() => {
    setCommandSearchIndex(0);
  }, [commandSearchQuery, commandSearchOpen]);

  useEffect(() => {
    if (!commandSearchOpen) return;
    const timer = window.setTimeout(() => {
      commandSearchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [commandSearchOpen]);

  const openCommandSearch = useCallback(() => {
    setCommandSearchOpen(true);
  }, []);

  const closeCommandSearch = useCallback(() => {
    setCommandSearchOpen(false);
    setCommandSearchQuery("");
    setCommandSearchIndex(0);
  }, []);

  const activateSearchResult = useCallback(
    (noteId) => {
      if (!noteId) return;
      setShowDeleted(false);
      setActiveNoteId(noteId);
      closeCommandSearch();
    },
    [closeCommandSearch]
  );

  /* Keyboard shortcuts: Ctrl+S (save), Ctrl+H (settings), Ctrl+K (command search) */
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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandSearch();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        openCommandSearch();
      }
      if (event.key === "Escape" && commandSearchOpen) {
        event.preventDefault();
        closeCommandSearch();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCommandSearch, commandSearchOpen, openCommandSearch, saveCurrentNote]);

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
            stickyNotes={stickyNotes}
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
              stickyNotes={stickyNotes}
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
            onEditorDoubleClick={handleEditorDoubleClick}
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
            onNoteFontSizeIncrease={handleNoteFontScaleIncrease}
            onNoteFontSizeDecrease={handleNoteFontScaleDecrease}
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

      {commandSearchOpen && (
        <Box
          onClick={closeCommandSearch}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2400,
            background: `linear-gradient(180deg, ${alpha(activeNoteTint, 0.08)} 0%, rgba(10, 12, 14, 0.28) 100%)`,
            backdropFilter: "blur(18px) saturate(1.4)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            px: 2,
            pt: { xs: "8vh", md: "10vh" },
            animation: "cmdFadeIn 200ms ease-out",
            "@keyframes cmdFadeIn": {
              "0%": { opacity: 0 },
              "100%": { opacity: 1 },
            },
          }}
        >
          <Box
            onClick={(event) => event.stopPropagation()}
            sx={{
              width: "100%",
              maxWidth: 680,
              borderRadius: 5,
              overflow: "hidden",
              background: `linear-gradient(168deg, rgba(255, 255, 255, 0.84) 0%, ${alpha(activeNoteTint, 0.06)} 40%, ${alpha(activeNoteTint, 0.03)} 100%)`,
              backdropFilter: "blur(24px) saturate(1.6)",
              border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.15),
                0 24px 80px rgba(20, 20, 20, 0.16),
                0 8px 32px ${alpha(activeNoteTint, 0.08)},
                inset 0 1px 0 rgba(255, 255, 255, 0.55)
              `,
              animation: "cmdSlideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)",
              "@keyframes cmdSlideUp": {
                "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
                "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
              },
            }}
          >
            {/* Search Input Area */}
            <Box sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom: `1px solid ${alpha(activeNoteTint, 0.14)}`,
            }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${alpha(activeNoteTint, 0.18)} 0%, ${alpha(activeNoteTint, 0.08)} 100%)`,
                border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
                flexShrink: 0,
              }}>
                <Box component="svg" viewBox="0 0 24 24" sx={{ width: 18, height: 18, fill: "none", stroke: alpha(activeNoteTint, 0.7), strokeWidth: 2.2, strokeLinecap: "round" }}>
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </Box>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  ref={commandSearchInputRef}
                  component="input"
                  value={commandSearchQuery}
                  onChange={(event) => setCommandSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setCommandSearchIndex((prev) => Math.min(prev + 1, Math.max(commandSearchResults.length - 1, 0)));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setCommandSearchIndex((prev) => Math.max(prev - 1, 0));
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      const target = commandSearchResults[commandSearchIndex] || commandSearchResults[0];
                      if (target) activateSearchResult(target.id);
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      closeCommandSearch();
                    }
                  }}
                  placeholder="Search notes..."
                  sx={{
                    width: "100%",
                    border: 0,
                    background: "transparent",
                    color: "#1e1e1e",
                    borderRadius: 0,
                    px: 0,
                    py: 0,
                    fontSize: { xs: 20, md: 22 },
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                    outline: "none",
                    boxShadow: "none",
                    fontFamily: "inherit",
                    "&::placeholder": { color: alpha("#3a3a3a", 0.35), fontWeight: 500 },
                  }}
                />
              </Box>
              <Box
                onClick={closeCommandSearch}
                sx={{
                  px: 0.9,
                  py: 0.35,
                  borderRadius: 1.5,
                  bgcolor: alpha(activeNoteTint, 0.1),
                  border: `1px solid ${alpha(activeNoteTint, 0.2)}`,
                  cursor: "pointer",
                  "&:hover": { bgcolor: alpha(activeNoteTint, 0.2) },
                  transition: "background-color 150ms ease",
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(activeNoteTint, 0.8), letterSpacing: "0.04em" }}>ESC</Typography>
              </Box>
            </Box>

            {/* Results Area */}
            <Box sx={{
              maxHeight: "52vh",
              overflowY: "auto",
              py: 0.8,
              px: 0.8,
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-thumb": { bgcolor: alpha(activeNoteTint, 0.18), borderRadius: 3 },
            }}>
              {commandSearchResults.length === 0 ? (
                <Box sx={{
                  px: 2,
                  py: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}>
                  <Box component="svg" viewBox="0 0 24 24" sx={{ width: 40, height: 40, fill: "none", stroke: alpha(activeNoteTint, 0.3), strokeWidth: 1.5, strokeLinecap: "round" }}>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </Box>
                  <Typography sx={{ fontSize: 15, color: alpha("#2a2a2a", 0.4), fontWeight: 500 }}>No matching notes found</Typography>
                </Box>
              ) : (
                commandSearchResults.map((note, index) => {
                  const title = note.title?.trim() || "Untitled";
                  const snippet = plainTextFromHtml(note.content || "");
                  const isSelected = index === commandSearchIndex;
                  const noteColor = note.color || "#F7E36D";

                  return (
                    <Box
                      key={note.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => activateSearchResult(note.id)}
                      onMouseEnter={() => setCommandSearchIndex(index)}
                      sx={{
                        px: 1.8,
                        py: 1.2,
                        cursor: "pointer",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        bgcolor: isSelected ? alpha(activeNoteTint, 0.10) : "transparent",
                        border: isSelected ? `1px solid ${alpha(activeNoteTint, 0.18)}` : "1px solid transparent",
                        transition: "all 150ms ease",
                        mb: 0.4,
                        "&:hover": {
                          bgcolor: alpha(activeNoteTint, 0.10),
                          border: `1px solid ${alpha(activeNoteTint, 0.18)}`,
                        },
                      }}
                    >
                      <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: noteColor,
                        boxShadow: `0 0 0 2px ${alpha(noteColor, 0.2)}`,
                        mt: 0.7,
                        flexShrink: 0,
                      }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{
                          fontSize: { xs: 15, md: 16 },
                          fontWeight: 700,
                          color: isSelected ? "#1a1a1a" : "#2a2a2a",
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}>
                          {title}
                        </Typography>
                        <Typography noWrap sx={{
                          fontSize: 13,
                          color: alpha("#2a2a2a", 0.5),
                          mt: 0.15,
                          lineHeight: 1.3,
                        }}>
                          {(snippet || "Empty note").slice(0, 120)}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Box sx={{
                          px: 0.7,
                          py: 0.25,
                          borderRadius: 1.2,
                          bgcolor: alpha(activeNoteTint, 0.14),
                          mt: 0.4,
                          flexShrink: 0,
                        }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: alpha(activeNoteTint, 0.8) }}>↵</Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Bottom Hint Bar */}
            <Box sx={{
              px: 2.5,
              py: 1.2,
              borderTop: `1px solid ${alpha(activeNoteTint, 0.12)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: `linear-gradient(180deg, ${alpha(activeNoteTint, 0.02)} 0%, ${alpha(activeNoteTint, 0.05)} 100%)`,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ px: 0.6, py: 0.2, borderRadius: 1, bgcolor: alpha(activeNoteTint, 0.08), border: `1px solid ${alpha(activeNoteTint, 0.14)}` }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: alpha(activeNoteTint, 0.75) }}>↑↓</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10.5, color: alpha("#2a2a2a", 0.4), fontWeight: 500 }}>Navigate</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ px: 0.6, py: 0.2, borderRadius: 1, bgcolor: alpha(activeNoteTint, 0.08), border: `1px solid ${alpha(activeNoteTint, 0.14)}` }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: alpha(activeNoteTint, 0.75) }}>↵</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10.5, color: alpha("#2a2a2a", 0.4), fontWeight: 500 }}>Open</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ px: 0.6, py: 0.2, borderRadius: 1, bgcolor: alpha(activeNoteTint, 0.08), border: `1px solid ${alpha(activeNoteTint, 0.14)}` }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: alpha(activeNoteTint, 0.75) }}>Esc</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10.5, color: alpha("#2a2a2a", 0.4), fontWeight: 500 }}>Close</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 10.5, color: alpha("#2a2a2a", 0.3), fontWeight: 600, letterSpacing: "0.04em" }}>
                ⌘K / Ctrl+K
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

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
