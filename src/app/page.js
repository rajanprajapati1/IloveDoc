"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Drawer, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import DocbookAIPanel from "@/components/docbook/DocbookAIPanel";
import DocbookEditorSurface from "@/components/docbook/DocbookEditorSurface";
import DocbookOverlays from "@/components/docbook/DocbookOverlays";
import DocbookSidebar from "@/components/docbook/DocbookSidebar";
import DocbookCircleToEditOverlay from "@/components/docbook/DocbookCircleToEditOverlay";
import FeedbackModal from "@/components/docbook/FeedbackModal";
import FeedbackAdminPanel from "@/components/docbook/FeedbackAdminPanel";
import PricingPanel from "@/components/docbook/PricingPanel";
import ShareNoteModal from "@/components/docbook/share/ShareNoteModal";
import Loader from "@/components/ui/Loader";
import WelcomeIntroModal from "@/components/docbook/WelcomeIntroModal";
import ChangelogPanel from "@/components/docbook/ChangelogPanel";
import SettingsDashboard from "@/components/docbook/SettingsDashboard";
import CustomizationPanel, { loadCustomPeople, loadCustomFolders, loadCustomLocations, loadCustomEmojis, loadNoteReactions } from "@/components/docbook/CustomizationPanel";
import { getDefaultTableHtml } from "@/components/docbook/editor/tableUtils";
import {
  buildId,
  createNote,
  createStickyNote,
  createTodoHtml,
  defaultNoteContent,
  isExpiredDelete,
  plainTextFromHtml,
  stickyColorOptions,
  uncheckedIconSvg,
  checkedIconSvg,
} from "@/components/docbook/shared";
import { docbookDb } from "../lib/docbookDb";
import AppearanceDashboard from "@/components/docbook/ppanel/CustomizationPanel";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeNoteRecord(note) {
  return {
    ...note,
    links: Array.isArray(note?.links) ? [...new Set(note.links.filter(Boolean))] : [],
    isImportant: Boolean(note?.isImportant),
  };
}

function stripRemovedEditorMarkup(html = "") {
  if (
    !html
    || (
      !html.includes("data-todo-important")
      && !html.includes("data-todo-important-toggle")
      && !html.includes("data-important")
    )
  ) {
    return html;
  }

  if (typeof document === "undefined") {
    return html
      .replace(/\sdata-todo-important="(?:true|false)"/g, "")
      .replace(/<span data-todo-important-toggle="true"[^>]*><\/span>/g, "")
      .replace(/<div data-important="true"[^>]*>(?:<span data-important-icon="true"[^>]*>[\s\S]*?<\/span>)?<div data-important-text="true"[^>]*>([\s\S]*?)<\/div><\/div>/g, "<p>$1</p>");
  }

  const temp = document.createElement("div");
  temp.innerHTML = html;

  temp.querySelectorAll("[data-todo]").forEach((todo) => {
    todo.removeAttribute("data-todo-important");
    todo.querySelectorAll("[data-todo-important-toggle]").forEach((toggle) => toggle.remove());
  });

  temp.querySelectorAll("[data-important]").forEach((importantBlock) => {
    const textContainer = importantBlock.querySelector("[data-important-text]");
    const paragraph = document.createElement("p");
    paragraph.innerHTML = textContainer ? textContainer.innerHTML : "<br>";
    importantBlock.parentNode?.replaceChild(paragraph, importantBlock);
  });

  return temp.innerHTML;
}

function buildActiveNoteOrder(noteList = []) {
  return noteList
    .filter((note) => !note.deletedAt)
    .map((note) => note.id);
}

function applyPersistedActiveOrder(noteList = [], orderedIds = []) {
  const activeNotes = noteList.filter((note) => !note.deletedAt);
  const deleted = noteList.filter((note) => note.deletedAt);
  const activeById = new Map(activeNotes.map((note) => [note.id, note]));

  const orderedActive = [];
  for (const id of orderedIds) {
    const note = activeById.get(id);
    if (!note) continue;
    orderedActive.push(note);
    activeById.delete(id);
  }

  const remainingActive = activeNotes
    .filter((note) => activeById.has(note.id))
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  return [...orderedActive, ...remainingActive, ...deleted];
}

const highlightBlockSelector = "li, p, div, td, th, blockquote, h1, h2, h3, h4, h5, h6";

export default function Home() {
  const editorRef = useRef(null);

  const savedSelectionRangeRef = useRef(null);
  const autoSyncTimerRef = useRef(null);
  const noteFontScaleCommitRef = useRef(null);
  const hasHydratedChangeTrackerRef = useRef(false);
  const commandSearchInputRef = useRef(null);
  const aiWriteSessionRef = useRef(null);
  const aiCancelButtonRef = useRef(null);
  const liveEditorContentRef = useRef("");

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [notes, setNotes] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState("");
  const [activeStickyNoteId, setActiveStickyNoteId] = useState("");
  const [stickyDragState, setStickyDragState] = useState({ stickyId: "", targetNoteId: "" });
  const [ready, setReady] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState({ visible: false, x: 0, y: 0 });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [linkAnchorEl, setLinkAnchorEl] = useState(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [fontFamilyAnchorEl, setFontFamilyAnchorEl] = useState(null);
  const [fontSizeAnchorEl, setFontSizeAnchorEl] = useState(null);
  const [headingAnchorEl, setHeadingAnchorEl] = useState(null);
  const [hoverPreview, setHoverPreview] = useState({ visible: false, x: 0, y: 0, url: "", label: "" });


  const [listMenuAnchorEl, setListMenuAnchorEl] = useState(null);
  const [noteAnchorEl, setNoteAnchorEl] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  /* Settings & Selection Panel state */
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackAdminEnabled, setFeedbackAdminEnabled] = useState(false);
  const [feedbackAdminOpen, setFeedbackAdminOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [welcomeIntroOpen, setWelcomeIntroOpen] = useState(false);
  const [customizationPanelOpen, setCustomizationPanelOpen] = useState(false);
  const [customPeople, setCustomPeople] = useState([]);
  const [customFolders, setCustomFolders] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [customEmojis, setCustomEmojis] = useState([]);
  const [noteReactions, setNoteReactions] = useState({});
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
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const [aiDocumentWriting, setAiDocumentWriting] = useState(false);
  const [circleToEditMode, setCircleToEditMode] = useState(false);
  const [liveNoteFontScale, setLiveNoteFontScale] = useState(null);

  const activeNotes = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);
  const deletedNotes = useMemo(() => notes.filter((note) => note.deletedAt && !isExpiredDelete(note.deletedAt)), [notes]);
  const activeNote = useMemo(() => activeNotes.find((note) => note.id === activeNoteId) || activeNotes[0] || null, [activeNotes, activeNoteId]);
  const effectiveActiveNote = useMemo(() => {
    if (!activeNote) return null;
    if (liveNoteFontScale == null) return activeNote;
    const persistedScale = activeNote.fontScale || 1;
    if (Math.abs(liveNoteFontScale - persistedScale) < 0.0001) return activeNote;
    return { ...activeNote, fontScale: liveNoteFontScale };
  }, [activeNote, liveNoteFontScale]);
  const activeNoteStickyNotes = useMemo(() => stickyNotes.filter((note) => note.noteId === activeNoteId), [stickyNotes, activeNoteId]);
  const linkedNotes = useMemo(() => {
    if (!activeNote) return [];
    const linkedIds = new Set(Array.isArray(activeNote.links) ? activeNote.links : []);
    return activeNotes.filter((note) => linkedIds.has(note.id));
  }, [activeNote, activeNotes]);
  const backlinkNotes = useMemo(() => {
    if (!activeNote) return [];
    return activeNotes.filter((note) => note.id !== activeNote.id && Array.isArray(note.links) && note.links.includes(activeNote.id));
  }, [activeNote, activeNotes]);
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncFeedbackAdminFromUrl = () => {
      const adminKey = new URLSearchParams(window.location.search).get("admin");
      const enabled = adminKey === "rajan";
      setFeedbackAdminEnabled(enabled);
      setFeedbackAdminOpen(enabled);
    };

    syncFeedbackAdminFromUrl();
    window.addEventListener("popstate", syncFeedbackAdminFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFeedbackAdminFromUrl);
    };
  }, []);

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

  const handleAutoSaveChange = useCallback((enabled) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem("docbook_local_autosave", String(enabled));
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
    selection.addRange(range.cloneRange());
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
      savedSelectionRangeRef.current = nextRange.cloneRange();
      return nextRange;
    },
    [isRangeInsideEditor]
  );

  const selectNodeContents = useCallback(
    (node) => {
      if (!node) return null;
      const range = document.createRange();
      range.selectNodeContents(node);
      return selectEditorRange(range);
    },
    [selectEditorRange]
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
      const toolbarHeight = 48;
      const safeMargin = 8;
      const rawX = rect.left + rect.width / 2;
      const clampedX = Math.max(120, Math.min(rawX, window.innerWidth - 120));

      /* If not enough space above selection, show below */
      let rawY;
      if (rect.top - toolbarHeight - safeMargin < 0) {
        rawY = rect.bottom + safeMargin + toolbarHeight;
      } else {
        rawY = Math.max(toolbarHeight + safeMargin, rect.top - 12);
      }

      const next = { visible: true, x: clampedX, y: rawY };
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

  const commitNoteFontScale = useCallback(
    (nextFontScale) => {
      if (!activeNoteId) return;
      if (noteFontScaleCommitRef.current) {
        clearTimeout(noteFontScaleCommitRef.current);
      }
      noteFontScaleCommitRef.current = setTimeout(() => {
        noteFontScaleCommitRef.current = null;
        startTransition(() => {
          updateCurrentNote((note) => {
            const persistedScale = note.fontScale || 1;
            if (Math.abs(persistedScale - nextFontScale) < 0.0001) return note;
            return { ...note, fontScale: nextFontScale };
          });
        });
      }, 90);
    },
    [activeNoteId, updateCurrentNote]
  );

  const applyNoteFontScale = useCallback(
    (updater) => {
      const persistedScale = activeNote?.fontScale || 1;
      const baseScale = liveNoteFontScale ?? persistedScale;
      const nextFontScale = clamp(updater(baseScale), 0.72, 1.55);
      if (Math.abs(nextFontScale - baseScale) < 0.0001) return;
      setLiveNoteFontScale(nextFontScale);
      commitNoteFontScale(nextFontScale);
    },
    [activeNote, liveNoteFontScale, commitNoteFontScale]
  );

  const connectNoteToActive = useCallback(
    (targetNoteId) => {
      if (!activeNoteId || !targetNoteId || activeNoteId === targetNoteId) return;
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== activeNoteId) return note;
          const links = Array.isArray(note.links) ? note.links : [];
          if (links.includes(targetNoteId)) return note;
          return {
            ...note,
            links: [...links, targetNoteId],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [activeNoteId]
  );

  const disconnectNoteFromActive = useCallback(
    (targetNoteId) => {
      if (!activeNoteId || !targetNoteId) return;
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== activeNoteId) return note;
          const links = Array.isArray(note.links) ? note.links : [];
          if (!links.includes(targetNoteId)) return note;
          return {
            ...note,
            links: links.filter((id) => id !== targetNoteId),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [activeNoteId]
  );

  /* ── Fast content sync (cheap — just reads innerHTML) ── */
  const captureEditorContent = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return liveEditorContentRef.current || "";
    const html = stripRemovedEditorMarkup(editor.innerHTML.replace(/\u200B/g, ""));
    liveEditorContentRef.current = html;
    return html;
  }, []);

  const syncEditorContent = useCallback(() => {
    if (!activeNoteId) return liveEditorContentRef.current || "";
    const html = captureEditorContent();
    updateCurrentNote((note) => ({ ...note, content: html, updatedAt: new Date().toISOString() }));
    return html;
  }, [activeNoteId, captureEditorContent, updateCurrentNote]);

  /* ── Debounced content sync for typing (fires 250ms after last keystroke) ── */
  const debouncedSyncEditorHtml = useCallback(() => {
    captureEditorContent();
  }, [captureEditorContent]);

  /* ── Immediate sync (used by blur, commands, toolbar actions) ── */
  const syncEditorHtml = useCallback(() => {
    syncEditorContent();
  }, [syncEditorContent]);



  const persistActiveNoteFromEditor = useCallback(async () => {
    if (!activeNoteId || !activeNote) return null;

    syncEditorHtml();

    const liveContent = (captureEditorContent() || activeNote.content || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    const updatedAt = new Date().toISOString();

    const nextNote = {
      ...activeNote,
      content: liveContent,
      updatedAt,
    };

    setNotes((prev) =>
      prev.map((note) => (note.id === activeNoteId ? nextNote : note))
    );

    await docbookDb.notes.put(nextNote);
    await docbookDb.meta.put({ key: "activeNoteId", value: activeNoteId });
    return nextNote;
  }, [activeNote, activeNoteId, captureEditorContent, syncEditorHtml]);



  useEffect(() => {
    return () => {
    };
  }, [activeNoteId, syncEditorContent]);

  const runCommand = useCallback(
    (command, value = null) => {
      editorRef.current?.focus();

      if ((command === "insertOrderedList" || command === "insertUnorderedList") && window.getSelection().rangeCount > 0) {
        // Intercept native list insertion to clean up any selected custom data-todo items first
        const range = window.getSelection().getRangeAt(0);
        const clone = range.cloneContents();
        if (clone.querySelector('[data-todo]')) {
          const tempDiv = document.createElement("div");
          tempDiv.appendChild(clone);

          let hasTodos = false;
          const todos = tempDiv.querySelectorAll('[data-todo]');
          todos.forEach(todo => {
            hasTodos = true;
            const textContainer = todo.querySelector("div[data-todo-text]");
            const textHtml = textContainer ? textContainer.innerHTML : todo.innerHTML;
            const p = document.createElement("p");
            p.innerHTML = textHtml;
            todo.parentNode.replaceChild(p, todo);
          });

          if (hasTodos) {
            document.execCommand("insertHTML", false, tempDiv.innerHTML);
            // After replacing todos with paragraphs, let the native command wrap them in a list
          }
        }
      }

      document.execCommand(command, false, value);
      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
    },
    [syncEditorHtml, updateSelectionMenuPosition]
  );



  const saveCurrentNote = useCallback(async () => {
    if (!activeNoteId) return;

    await persistActiveNoteFromEditor();

    const now = new Date().toISOString();
    let snapshot = null;

    setNotes((prev) => {
      const next = prev.map((note) =>
        note.id === activeNoteId
          ? {
            ...note,
            title: note.title?.trim() || "Untitled",
            updatedAt: now,
          }
          : note
      );
      snapshot = next;
      return next;
    });

    if (snapshot) {
      await docbookDb.notes.bulkPut(snapshot);
      await docbookDb.meta.put({ key: "activeNoteId", value: activeNoteId });
    }
  }, [activeNoteId, persistActiveNoteFromEditor]);

  const reorderNotes = useCallback(async (sourceIndex, destinationIndex) => {
    let snapshot = null;

    setNotes((prev) => {
      const active = prev.filter((note) => !note.deletedAt);
      const deleted = prev.filter((note) => note.deletedAt);
      if (
        sourceIndex < 0
        || destinationIndex < 0
        || sourceIndex >= active.length
        || destinationIndex >= active.length
      ) {
        return prev;
      }

      const reorderedActive = [...active];
      const [moved] = reorderedActive.splice(sourceIndex, 1);
      if (!moved) return prev;
      reorderedActive.splice(destinationIndex, 0, moved);
      snapshot = [...reorderedActive, ...deleted];
      return snapshot;
    });

    if (!snapshot) return;
    await docbookDb.notes.bulkPut(snapshot);
    await docbookDb.meta.put({ key: "noteOrder", value: buildActiveNoteOrder(snapshot) });
  }, []);

  const toggleImportantNote = useCallback(async (noteId) => {
    let nextIsImportant = false;

    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        nextIsImportant = !Boolean(note.isImportant);
        return { ...note, isImportant: nextIsImportant };
      })
    );

    await docbookDb.notes.update(noteId, { isImportant: nextIsImportant });
  }, []);

  const createNewNote = useCallback(async () => {
    await persistActiveNoteFromEditor();
    const fresh = createNote({ content: "<p></p>" });
    setNotes((prev) => [fresh, ...prev]);
    setActiveNoteId(fresh.id);
    setShowDeleted(false);
    setShowChangelog(false);
    setShowSettings(false);
    hideSelectionMenu();
    await docbookDb.notes.put(fresh);
    await docbookDb.meta.put({ key: "activeNoteId", value: fresh.id });
  }, [hideSelectionMenu, persistActiveNoteFromEditor]);

  const cloneNote = useCallback(async (noteId) => {
    if (!noteId) return null;

    const sourceNote =
      noteId === activeNoteId
        ? await persistActiveNoteFromEditor()
        : notes.find((note) => note.id === noteId) || null;

    if (!sourceNote) return null;

    const now = new Date().toISOString();
    const clonedNoteId = buildId();
    const sourceTitle = sourceNote.title?.trim() || "Untitled";
    const clonedNote = normalizeNoteRecord({
      ...sourceNote,
      id: clonedNoteId,
      title: `${sourceTitle} - Copy`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      shareLink: null,
    });
    const clonedStickyNotes = stickyNotes
      .filter((sticky) => sticky.noteId === noteId)
      .map((sticky) => ({
        ...sticky,
        id: buildId(),
        noteId: clonedNoteId,
        createdAt: now,
      }));

    setNotes((prev) => [clonedNote, ...prev]);
    if (clonedStickyNotes.length > 0) {
      setStickyNotes((prev) => [...prev, ...clonedStickyNotes]);
    }
    setShowDeleted(false);
    setShowChangelog(false);
    setShowSettings(false);
    setActiveNoteId(clonedNoteId);
    hideSelectionMenu();
    hideHoverPreview();

    const sourceReactions = noteReactions[noteId] || [];
    if (sourceReactions.length > 0) {
      setNoteReactions((prev) => {
        const updated = { ...prev, [clonedNoteId]: [...sourceReactions] };
        localStorage.setItem("docbook_note_reactions", JSON.stringify(updated));
        return updated;
      });
    }

    await docbookDb.transaction("rw", docbookDb.notes, docbookDb.stickyNotes, docbookDb.meta, async () => {
      await docbookDb.notes.put(clonedNote);
      if (clonedStickyNotes.length > 0) {
        await docbookDb.stickyNotes.bulkPut(clonedStickyNotes);
      }
      await docbookDb.meta.put({ key: "activeNoteId", value: clonedNoteId });
    });

    return clonedNote;
  }, [activeNoteId, hideHoverPreview, hideSelectionMenu, noteReactions, notes, persistActiveNoteFromEditor, stickyNotes]);

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

  const persistNoteShareLink = useCallback(async (noteId, shareLink) => {
    if (!noteId) return;

    setNotes((prev) =>
      prev.map((note) => (
        note.id === noteId
          ? { ...note, shareLink: shareLink || null }
          : note
      ))
    );

    await docbookDb.notes.update(noteId, { shareLink: shareLink || null });
  }, []);

  const openShareModal = useCallback(async () => {
    if (!activeNoteId) return;
    await persistActiveNoteFromEditor();
    setShareModalOpen(true);
  }, [activeNoteId, persistActiveNoteFromEditor]);

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
      setNotes((prev) =>
        prev
          .filter((note) => note.id !== noteId)
          .map((note) => ({
            ...note,
            links: Array.isArray(note.links) ? note.links.filter((id) => id !== noteId) : [],
          }))
      );
      setStickyNotes((prev) => prev.filter((note) => note.noteId !== noteId));
      setActiveStickyNoteId((prev) => (stickyNotes.some((note) => note.id === prev && note.noteId === noteId) ? "" : prev));
      await docbookDb.transaction("rw", docbookDb.notes, docbookDb.stickyNotes, async () => {
        await docbookDb.notes.delete(noteId);
        await docbookDb.stickyNotes.where("noteId").equals(noteId).delete();
        const linkedNotesToUpdate = await docbookDb.notes.filter((note) => Array.isArray(note.links) && note.links.includes(noteId)).toArray();
        if (linkedNotesToUpdate.length > 0) {
          await docbookDb.notes.bulkPut(
            linkedNotesToUpdate.map((note) => ({
              ...note,
              links: note.links.filter((id) => id !== noteId),
            }))
          );
        }
      });
    },
    [stickyNotes]
  );

  const handleOpenSelectionPanel = useCallback(() => {
    /* no-op: selection panel not currently enabled */
  }, []);

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

          const textContainer = todoDiv.querySelector("div[data-todo-text]");
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
    [syncEditorHtml]
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

    /* Always insert a zero-width space after the highlight to provide a cursor landing zone */
    const spacer = document.createTextNode("\u200B");
    highlightSpan.parentNode?.insertBefore(spacer, highlightSpan.nextSibling);

    const afterRange = document.createRange();
    afterRange.setStartAfter(spacer);
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

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      // No selection — insert a single empty todo
      const todoHtml = createTodoHtml({ trailingParagraph: true });
      document.execCommand("insertHTML", false, todoHtml);
      syncEditorHtml();
      return;
    }

    // Has selection — split into individual lines/blocks and make each a todo
    const range = selection.getRangeAt(0);
    const clone = range.cloneContents();
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(clone);

    // Collect individual lines from the selection
    const lines = [];
    const collectLines = (container) => {
      const children = container.childNodes;
      if (children.length === 0) return;

      for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
          // Split by newlines
          const parts = child.textContent.split(/\n/);
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed) lines.push(trimmed);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName?.toUpperCase();

          // Handle existing todos
          if (child.getAttribute("data-todo") !== null) {
            const textContainer = child.querySelector("div[data-todo-text]");
            const text = textContainer ? textContainer.innerHTML?.trim() : child.innerHTML?.trim();
            if (text && text !== "<br>") lines.push(text);
          }
          // Traverse nested lists
          else if (tag === "OL" || tag === "UL") {
            collectLines(child);
          }
          else if (["DIV", "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"].includes(tag)) {
            // Block-level element
            const text = child.innerHTML?.trim();
            if (text && text !== "<br>") lines.push(text);
          } else if (tag === "BR") {
            // BR is a line separator, handled by splitting
          } else {
            // Inline element: grab its outerHTML as a line
            const text = child.textContent?.trim();
            if (text && text !== "<br>") lines.push(child.outerHTML);
          }
        }
      }
    };

    collectLines(tempDiv);

    if (lines.length === 0) {
      lines.push("<br>");
    }

    // Build HTML with a separate todo for each line
    let todosHtml = "";
    for (const lineContent of lines) {
      todosHtml += createTodoHtml({ content: lineContent });
    }
    todosHtml += `<p><br></p>`;

    document.execCommand("insertHTML", false, todosHtml);
    syncEditorHtml();
  }, [restoreSelectionRange, syncEditorHtml]);

  const handleInsertTable = useCallback(() => {
    restoreSelectionRange();
    document.execCommand("insertHTML", false, getDefaultTableHtml());
    syncEditorHtml();
  }, [restoreSelectionRange, syncEditorHtml]);

  const handleFontFamilyChange = useCallback((fontFamily) => {
    restoreSelectionRange();
    document.execCommand("fontName", false, fontFamily);
    syncEditorHtml();
    window.requestAnimationFrame(() => {
      captureSelectionRange();
      updateSelectionMenuPosition();
    });
  }, [captureSelectionRange, restoreSelectionRange, syncEditorHtml, updateSelectionMenuPosition]);

  const applySelectedFontSize = useCallback(
    (fontSizePx) => {
      restoreSelectionRange();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;

      if (sel.isCollapsed) {
        applyNoteFontScale(() => fontSizePx / 52);
        return false;
      }

      const range = sel.getRangeAt(0);

      // First: strip any existing font-size spans within the selection to prevent nesting
      const frag = range.extractContents();
      const tempContainer = document.createElement("span");
      tempContainer.appendChild(frag);

      // Remove font-size from all nested spans
      const innerSpans = tempContainer.querySelectorAll('span[style]');
      innerSpans.forEach((s) => {
        s.style.removeProperty('font-size');
        // If the span has no other meaningful styles, unwrap it
        if (!s.getAttribute('style')?.trim()) {
          const parent = s.parentNode;
          while (s.firstChild) parent.insertBefore(s.firstChild, s);
          parent.removeChild(s);
        }
      });

      // Now wrap the cleaned content in a single new font-size span
      const span = document.createElement("span");
      span.style.fontSize = `${fontSizePx}px`;
      while (tempContainer.firstChild) {
        span.appendChild(tempContainer.firstChild);
      }

      range.insertNode(span);
      selectNodeContents(span);
      syncEditorHtml();
      window.requestAnimationFrame(updateSelectionMenuPosition);
      return true;
    },
    [applyNoteFontScale, restoreSelectionRange, selectNodeContents, syncEditorHtml, updateSelectionMenuPosition]
  );

  const handleTextBlockFormatChange = useCallback(
    (blockTag) => {
      restoreSelectionRange();
      document.execCommand("formatBlock", false, `<${blockTag}>`);
      syncEditorHtml();
      window.requestAnimationFrame(() => {
        captureSelectionRange();
        updateSelectionMenuPosition();
      });
    },
    [captureSelectionRange, restoreSelectionRange, syncEditorHtml, updateSelectionMenuPosition]
  );

  const handleFontSizeIncrease = useCallback(() => {
    restoreSelectionRange();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      applyNoteFontScale((currentScale) => currentScale + 0.08);
      return;
    }

    const range = sel.getRangeAt(0);
    const startElement =
      range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
    const currentSize = parseFloat(window.getComputedStyle(startElement).fontSize) || 16;
    void applySelectedFontSize(clamp(Math.round(currentSize + 2), 10, 96));
  }, [applyNoteFontScale, applySelectedFontSize, restoreSelectionRange]);

  const handleFontSizeDecrease = useCallback(() => {
    restoreSelectionRange();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      applyNoteFontScale((currentScale) => currentScale - 0.08);
      return;
    }

    const range = sel.getRangeAt(0);
    const startElement =
      range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
    const currentSize = parseFloat(window.getComputedStyle(startElement).fontSize) || 16;
    void applySelectedFontSize(clamp(Math.round(currentSize - 2), 10, 96));
  }, [applyNoteFontScale, applySelectedFontSize, restoreSelectionRange]);

  const handleNoteFontScaleIncrease = useCallback(() => {
    applyNoteFontScale((currentScale) => currentScale + 0.08);
  }, [applyNoteFontScale]);

  const handleNoteFontScaleDecrease = useCallback(() => {
    applyNoteFontScale((currentScale) => currentScale - 0.08);
  }, [applyNoteFontScale]);



  /* Import notes from cloud */
  const handleImportNotes = useCallback(async (cloudNotes) => {
    if (!cloudNotes || cloudNotes.length === 0) return;
    const normalizedCloudNotes = cloudNotes.map(normalizeNoteRecord);

    setNotes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newNotes = [];
      const updatedPrev = [...prev];

      for (const cloudNote of normalizedCloudNotes) {
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
    await docbookDb.notes.bulkPut(normalizedCloudNotes);
  }, []);

  /* ─── Bootstrap ─── */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      let shouldShowWelcomeIntro = false;
      let storedNotes = (await docbookDb.notes.orderBy("updatedAt").reverse().toArray()).map(normalizeNoteRecord);
      let storedStickyNotes = await docbookDb.stickyNotes.toArray();

      /* Purge notes that were soft-deleted more than 7 days ago */
      const expiredIds = storedNotes.filter((n) => isExpiredDelete(n.deletedAt)).map((n) => n.id);
      if (expiredIds.length > 0) {
        await docbookDb.transaction("rw", docbookDb.notes, async () => {
          for (const id of expiredIds) {
            await docbookDb.notes.delete(id);
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
      const noteOrderMeta = await docbookDb.meta.get("noteOrder");
      const persistedOrder = Array.isArray(noteOrderMeta?.value) ? noteOrderMeta.value : [];
      storedNotes = applyPersistedActiveOrder(storedNotes, persistedOrder);
      const preferred = activeMeta?.value;
      const availableNotes = storedNotes.filter((n) => !n.deletedAt);
      const initialActiveId = availableNotes.some((note) => note.id === preferred) ? preferred : availableNotes[0]?.id || "";

      if (cancelled) return;

      setNotes(storedNotes);
      setStickyNotes(storedStickyNotes);
      setActiveNoteId(initialActiveId);
      setReady(true);
      setWelcomeIntroOpen(shouldShowWelcomeIntro);

      /* ── Load custom people, folders, emojis, reactions from localStorage ── */
      setCustomPeople(loadCustomPeople());
      setCustomFolders(loadCustomFolders());
      setCustomLocations(loadCustomLocations());
      setCustomEmojis(loadCustomEmojis());
      setNoteReactions(loadNoteReactions());

      const storedAutoSave = localStorage.getItem("docbook_local_autosave");
      if (storedAutoSave !== null) setAutoSaveEnabled(storedAutoSave === "true");

      await docbookDb.meta.put({ key: "activeNoteId", value: initialActiveId });
    };

    void bootstrap();

    return () => {
      cancelled = true;
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
    if (!ready || notes.length === 0 || !autoSaveEnabled) return;
    const timeoutId = setTimeout(() => {
      void docbookDb.notes.bulkPut(notes);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [ready, notes, autoSaveEnabled]);

  useEffect(() => {
    if (!ready) return;
    const timeoutId = setTimeout(() => {
      void docbookDb.meta.put({ key: "noteOrder", value: buildActiveNoteOrder(notes) });
    }, 180);
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
    if (noteFontScaleCommitRef.current) {
      clearTimeout(noteFontScaleCommitRef.current);
      noteFontScaleCommitRef.current = null;
    }
    setLiveNoteFontScale(activeNote?.fontScale || 1);
  }, [activeNoteId, activeNote?.fontScale]);

  const loadedNoteIdRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !activeNote) return;
    const normalizedActiveContent = stripRemovedEditorMarkup(activeNote.content || "");
    if (loadedNoteIdRef.current !== activeNoteId) {
      editorRef.current.innerHTML = normalizedActiveContent;
      liveEditorContentRef.current = normalizedActiveContent;
      loadedNoteIdRef.current = activeNoteId;
      return;
    }

    if (document.activeElement === editorRef.current) {
      return;
    }

    const normCurrent = editorRef.current.innerHTML.replace(/[\u200B-\u200D\uFEFF]/g, "");
    const normActive = normalizedActiveContent.replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (normCurrent !== normActive) {
      editorRef.current.innerHTML = normalizedActiveContent;
      liveEditorContentRef.current = normalizedActiveContent;
    }
  }, [activeNote?.content, activeNoteId, showSettings, showChangelog]);

  useEffect(() => () => {
    if (noteFontScaleCommitRef.current) {
      clearTimeout(noteFontScaleCommitRef.current);
    }
  }, []);

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

  const openAiPanel = useCallback(() => {
    setAiPanelOpen(true);
  }, []);

  const closeAiPanel = useCallback(() => {
    setAiPanelOpen(false);
  }, []);

  const startAiDraftWrite = useCallback(() => {
    if (!activeNoteId || !activeNote) return false;

    const selection = window.getSelection();
    let isTargetedEdit = false;
    let targetId = "docbook-ai-stream-target-" + Date.now();
    let selectedHtml = "";

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const div = document.createElement("div");
        div.appendChild(range.cloneContents());
        selectedHtml = div.innerHTML;

        const streamNode = document.createElement("span");
        streamNode.id = targetId;
        streamNode.className = "ai-streaming-text";
        range.deleteContents();
        range.insertNode(streamNode);

        isTargetedEdit = true;
      }
    }

    const currentContent = activeNote.content?.trim() ? activeNote.content : "<p></p>";
    const isEmpty = currentContent === "<p></p>" || currentContent === "<div><br></div>";

    if (isTargetedEdit) {
      aiWriteSessionRef.current = {
        noteId: activeNoteId,
        mode: "replace",
        targetId,
        baseContent: currentContent,
        originalSelectionHtml: selectedHtml,
      };
    } else {
      aiWriteSessionRef.current = {
        noteId: activeNoteId,
        mode: "append",
        baseContent: isEmpty ? "" : currentContent,
        separator: isEmpty ? "" : "<p><br></p>",
      };
    }

    setAiDocumentWriting(true);
    setAiWorking(true);
    return {
      selectedHtml,
      scope: isTargetedEdit ? "selection" : "append",
    };
  }, [activeNote, activeNoteId]);

  const streamAiDraftToActiveNote = useCallback((contentHtml) => {
    const session = aiWriteSessionRef.current;
    if (!session || !session.noteId) return false;

    const incomingContent = contentHtml?.trim() ? contentHtml : "";
    let normalizedContent = "";

    if (session.mode === "replace") {
      if (editorRef.current) {
        const targetSpan = editorRef.current.querySelector(`#${session.targetId}`);
        if (targetSpan) {
          targetSpan.innerHTML = incomingContent;
        }
        normalizedContent = editorRef.current.innerHTML.replace(/\u200B/g, "");
      } else {
        normalizedContent = session.baseContent;
      }
    } else {
      normalizedContent = `${session.baseContent}${session.separator}${incomingContent}` || "<p></p>";
      if (editorRef.current) {
        editorRef.current.innerHTML = normalizedContent;
      }
    }

    setNotes((prev) =>
      prev.map((note) =>
        note.id === session.noteId
          ? {
            ...note,
            content: normalizedContent,
          }
          : note
      )
    );

    window.requestAnimationFrame(updateSelectionMenuPosition);
    return true;
  }, [updateSelectionMenuPosition]);

  const applyAiDraftToActiveNote = useCallback(
    async (contentHtml) => {
      const session = aiWriteSessionRef.current;
      if (!activeNoteId || !activeNote || !session) return false;

      const incomingContent = contentHtml?.trim() ? contentHtml : "";
      if (!incomingContent) return false;

      let normalizedContent = "";

      if (editorRef.current) {
        if (session.mode === "replace") {
          const targetSpan = editorRef.current.querySelector(`#${session.targetId}`);
          if (targetSpan) {
            targetSpan.outerHTML = incomingContent;
          }
        } else {
          const newHtml = `${session.baseContent}${session.separator}${incomingContent}` || "<p></p>";
          editorRef.current.innerHTML = newHtml;
        }
        normalizedContent = editorRef.current.innerHTML.replace(/\u200B/g, "");
      } else {
        if (session.mode === "replace") {
          normalizedContent = session.baseContent;
        } else {
          normalizedContent = `${session.baseContent}${session.separator}${incomingContent}` || "<p></p>";
        }
      }

      const updatedAt = new Date().toISOString();

      setNotes((prev) =>
        prev.map((note) =>
          note.id === activeNoteId
            ? {
              ...note,
              content: normalizedContent,
              updatedAt,
            }
            : note
        )
      );

      await docbookDb.notes.update(activeNoteId, {
        content: normalizedContent,
        updatedAt,
      });

      aiWriteSessionRef.current = null;
      setAiDocumentWriting(false);
      setAiWorking(false);
      window.requestAnimationFrame(updateSelectionMenuPosition);
      return true;
    },
    [activeNote, activeNoteId, updateSelectionMenuPosition]
  );

  const cancelAiDraftWrite = useCallback(() => {
    const session = aiWriteSessionRef.current;
    if (!session?.noteId) {
      setAiDocumentWriting(false);
      setAiWorking(false);
      return;
    }

    let restoredContent = session.baseContent || "<p></p>";

    if (editorRef.current) {
      if (session.mode === "replace") {
        const targetSpan = editorRef.current.querySelector(`#${session.targetId}`);
        if (targetSpan) {
          targetSpan.outerHTML = session.originalSelectionHtml || "";
        }
        restoredContent = editorRef.current.innerHTML.replace(/\u200B/g, "");
      } else {
        editorRef.current.innerHTML = restoredContent;
      }
    }

    setNotes((prev) =>
      prev.map((note) =>
        note.id === session.noteId
          ? {
            ...note,
            content: restoredContent,
          }
          : note
      )
    );

    aiWriteSessionRef.current = null;
    setAiDocumentWriting(false);
    setAiWorking(false);
    window.requestAnimationFrame(updateSelectionMenuPosition);
  }, [updateSelectionMenuPosition]);

  const activateSearchResult = useCallback(
    async (noteId) => {
      if (!noteId) return;
      await persistActiveNoteFromEditor();
      setShowDeleted(false);
      setActiveNoteId(noteId);
      closeCommandSearch();
    },
    [closeCommandSearch, persistActiveNoteFromEditor]
  );

  /* Keyboard shortcuts: Ctrl+S save, Ctrl+H settings, Ctrl+K search, Ctrl+D AI */
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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setAiPanelOpen((prev) => !prev);
      }
      if (event.key === "Escape" && commandSearchOpen) {
        event.preventDefault();
        closeCommandSearch();
      }
      if (event.key === "Escape" && aiPanelOpen) {
        event.preventDefault();
        closeAiPanel();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aiPanelOpen, closeAiPanel, closeCommandSearch, commandSearchOpen, openCommandSearch, saveCurrentNote]);

  useEffect(() => {
    if (!aiDocumentWriting) return undefined;

    const shouldAllowTarget = (target) => {
      if (!(target instanceof Node)) return false;
      return Boolean(aiCancelButtonRef.current?.contains(target));
    };

    const blockPointerEvent = (event) => {
      if (shouldAllowTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    const blockKeyboardEvent = (event) => {
      if (shouldAllowTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    document.addEventListener("pointerdown", blockPointerEvent, true);
    document.addEventListener("mousedown", blockPointerEvent, true);
    document.addEventListener("click", blockPointerEvent, true);
    document.addEventListener("touchstart", blockPointerEvent, true);
    document.addEventListener("keydown", blockKeyboardEvent, true);

    return () => {
      document.removeEventListener("pointerdown", blockPointerEvent, true);
      document.removeEventListener("mousedown", blockPointerEvent, true);
      document.removeEventListener("click", blockPointerEvent, true);
      document.removeEventListener("touchstart", blockPointerEvent, true);
      document.removeEventListener("keydown", blockKeyboardEvent, true);
    };
  }, [aiDocumentWriting]);

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
              links: Array.isArray(n.links) ? n.links : [],
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
  }, [notes, customizationPanelOpen]);

  if (!ready) {
    return <Loader />;
  }

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
            showChangelog={showChangelog}
            stickyDragState={stickyDragState}
            isCollapsed={sidebarCollapsed}
            onToggleDeleted={async () => {
              await persistActiveNoteFromEditor();
              setShowChangelog(false);
              setShowSettings(false);
              setShowDeleted((prev) => !prev);
            }}
            onOpenChangelog={async (open) => {
              await persistActiveNoteFromEditor();
              setShowDeleted(false);
              setShowSettings(false);
              setShowChangelog(Boolean(open));
            }}
            showSettings={showSettings}
            onOpenSettingsPanel={async (open) => {
              await persistActiveNoteFromEditor();
              setShowDeleted(false);
              setShowChangelog(false);
              setShowSettings(Boolean(open));
            }}
            onCreateNote={() => {
              void createNewNote();
            }}
            onOpenNote={async (noteId) => {
              await persistActiveNoteFromEditor();
              setShowDeleted(false);
              setShowChangelog(false);
              setShowSettings(false);
              setActiveNoteId(noteId);
            }}
            onCloneNote={(noteId) => {
              void cloneNote(noteId);
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
            onOpenSettings={() => setCustomizationPanelOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
            onOpenPricing={() => setPricingOpen(true)}
            onExpand={() => setDrawerOpen(true)}
            onImportNotes={handleImportNotes}
            customEmojis={customEmojis}
            noteReactions={noteReactions}
            onToggleReaction={(noteId, emoji) => {
              setNoteReactions((prev) => {
                const current = prev[noteId] || [];
                const next = current[0] === emoji ? [] : [emoji];
                const updated = { ...prev, [noteId]: next };
                localStorage.setItem("docbook_note_reactions", JSON.stringify(updated));
                return updated;
              });
            }}
            onReorderNotes={(sourceIndex, destinationIndex) => {
              void reorderNotes(sourceIndex, destinationIndex);
            }}
            onToggleImportantNote={(noteId) => {
              void toggleImportantNote(noteId);
            }}
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
              showChangelog={showChangelog}
              stickyDragState={stickyDragState}
              onToggleDeleted={async () => {
                await persistActiveNoteFromEditor();
                setShowChangelog(false);
                setShowSettings(false);
                setShowDeleted((prev) => !prev);
              }}
              onOpenChangelog={async (open) => {
                await persistActiveNoteFromEditor();
                setShowDeleted(false);
                setShowSettings(false);
                setShowChangelog(Boolean(open));
                setDrawerOpen(false);
              }}
              onCreateNote={() => {
                void createNewNote();
                setDrawerOpen(false);
              }}
              onOpenNote={async (noteId) => {
                await persistActiveNoteFromEditor();
                setShowDeleted(false);
                setShowChangelog(false);
                setShowSettings(false);
                setActiveNoteId(noteId);
                setDrawerOpen(false);
              }}
              onCloneNote={(noteId) => {
                void cloneNote(noteId);
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
              showSettings={showSettings}
              onOpenSettingsPanel={async (open) => {
                await persistActiveNoteFromEditor();
                setShowDeleted(false);
                setShowChangelog(false);
                setShowSettings(Boolean(open));
                setDrawerOpen(false);
              }}
              onOpenSettings={() => {
                setCustomizationPanelOpen(true);
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
              customEmojis={customEmojis}
              noteReactions={noteReactions}
              onToggleReaction={(noteId, emoji) => {
                setNoteReactions((prev) => {
                  const current = prev[noteId] || [];
                  const next = current.includes(emoji) ? current.filter((e) => e !== emoji) : [...current, emoji];
                  const updated = { ...prev, [noteId]: next };
                  localStorage.setItem("docbook_note_reactions", JSON.stringify(updated));
                  return updated;
                });
              }}
              onReorderNotes={(sourceIndex, destinationIndex) => {
                void reorderNotes(sourceIndex, destinationIndex);
              }}
              onToggleImportantNote={(noteId) => {
                void toggleImportantNote(noteId);
              }}
            />
          </Drawer>

          {showSettings ? (
            <SettingsDashboard
              accentColor={activeNoteTint}
              notes={notes}
              onImportNotes={handleImportNotes}
              people={customPeople}
              folders={customFolders}
              locations={customLocations}
              selectedEmojis={customEmojis}
              onPeopleChange={setCustomPeople}
              onFoldersChange={setCustomFolders}
              onLocationsChange={setCustomLocations}
              onEmojisChange={setCustomEmojis}
            />
          ) : showChangelog ? (
            <>
              <ChangelogPanel />
            </>
          ) : (
            <DocbookEditorSurface
              collapseSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              activeNote={effectiveActiveNote}
              allNotes={activeNotes}
              linkedNotes={linkedNotes}
              backlinkNotes={backlinkNotes}
              editorRef={editorRef}
              stickyNotes={stickyNotes}
              activeStickyNoteId={activeStickyNoteId}
              onOpenLinkedNote={(noteId) => {
                setShowDeleted(false);
                setShowChangelog(false);
                setShowSettings(false);
                setActiveNoteId(noteId);
              }}
              onConnectNote={connectNoteToActive}
              onDisconnectNote={disconnectNoteFromActive}
              onTitleChange={(event) => updateCurrentNote((note) => ({ ...note, title: event.target.value, updatedAt: new Date().toISOString() }))}
              onNoteColorChange={(color) => updateCurrentNote((note) => ({ ...note, color }))}
              onEditorInput={debouncedSyncEditorHtml}
              onEditorBlur={syncEditorHtml}
              onEditorSelectionChange={handleEditorSelectionChange}
              onEditorClick={handleEditorClick}
              onEditorDoubleClick={handleEditorDoubleClick}
              onEditorMouseMove={handleEditorMouseMove}
              onEditorMouseLeave={hideHoverPreview}
              onEditorDragOver={handleEditorDragOver}
              onEditorDragLeave={handleEditorDragLeave}
              onEditorDrop={handleEditorDrop}
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
              shareInfo={activeNote?.shareLink || null}
              onOpenShare={() => {
                void openShareModal();
              }}
              onNoteFontSizeIncrease={handleNoteFontScaleIncrease}
              onNoteFontSizeDecrease={handleNoteFontScaleDecrease}
              onFontSizeIncrease={handleFontSizeIncrease}
              onFontSizeDecrease={handleFontSizeDecrease}
              autoSave={autoSaveEnabled}
              onAutoSaveChange={handleAutoSaveChange}
              syncBadgeState={syncBadgeState}
              customPeople={customPeople}
              customFolders={customFolders}
              customLocations={customLocations}
              onOpenCustomization={() => setCustomizationPanelOpen(true)}
            onPeopleChange={setCustomPeople}
            onFoldersChange={setCustomFolders}
              onLocationsChange={setCustomLocations}
              aiWorking={aiWorking}
            />
          )}
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
          fontSizeAnchorEl={fontSizeAnchorEl}
          setFontSizeAnchorEl={setFontSizeAnchorEl}
          headingAnchorEl={headingAnchorEl}
          setHeadingAnchorEl={setHeadingAnchorEl}
          changeFontFamily={handleFontFamilyChange}
          onApplyTextFontSize={applySelectedFontSize}
          onApplyBlockFormat={handleTextBlockFormatChange}
          onFontSizeIncrease={handleFontSizeIncrease}
          onFontSizeDecrease={handleFontSizeDecrease}
          linkAnchorEl={linkAnchorEl}
          setLinkAnchorEl={setLinkAnchorEl}
          linkDraft={linkDraft}
          setLinkDraft={setLinkDraft}
          listMenuAnchorEl={listMenuAnchorEl}
          setListMenuAnchorEl={setListMenuAnchorEl}
          editorRef={editorRef}
          syncEditorHtml={syncEditorHtml}
          noteAnchorEl={noteAnchorEl}
          setNoteAnchorEl={setNoteAnchorEl}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          buildId={buildId}
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

      <DocbookAIPanel
        open={aiPanelOpen}
        onClose={closeAiPanel}
        accentColor={activeNoteTint}
        activeNote={activeNote}
        docbookNotes={notes}
        activeStickyNotes={activeNoteStickyNotes}
        onDirectWriteStart={startAiDraftWrite}
        onDirectWriteChunk={streamAiDraftToActiveNote}
        onApplyDraft={applyAiDraftToActiveNote}
        onDirectWriteCancel={cancelAiDraftWrite}
        onWorkingChange={setAiWorking}
        onStartCircleToEdit={() => setCircleToEditMode(true)}
        onAppendToNote={async (content) => {
          const session = {
            noteId: activeNoteId,
            mode: "append",
            baseContent: activeNote.content || "",
            separator: (activeNote.content?.trim() && activeNote.content !== "<p></p>") ? "<p><br></p>" : "",
          };
          const normalizedContent = `${session.baseContent}${session.separator}${content}`;
          const updatedAt = new Date().toISOString();

          if (editorRef.current) {
            editorRef.current.innerHTML = normalizedContent;
          }
          setNotes((prev) => prev.map(n => n.id === activeNoteId ? { ...n, content: normalizedContent, updatedAt } : n));
          await docbookDb.notes.update(activeNoteId, { content: normalizedContent, updatedAt });
        }}
        onActionCreateNote={async (title, content) => {
          const normalizedContent = content?.trim() ? content : "<p></p>";
          const fresh = createNote({ title: title || "New Note", content: normalizedContent });
          setNotes((prev) => [fresh, ...prev]);
          setActiveNoteId(fresh.id);
          if (editorRef.current) {
            editorRef.current.innerHTML = normalizedContent;
          }
          await docbookDb.notes.put(fresh);
          await docbookDb.meta.put({ key: "activeNoteId", value: fresh.id });
        }}
        onActionEditNote={async (noteId, content) => {
          if (!noteId) return;
          const normalizedContent = content?.trim() ? content : "<p></p>";
          const updatedAt = new Date().toISOString();
          if (noteId === activeNoteId && editorRef.current) {
            editorRef.current.innerHTML = normalizedContent;
          }
          setNotes((prev) => prev.map(n => n.id === noteId ? { ...n, content: normalizedContent, updatedAt } : n));
          await docbookDb.notes.update(noteId, { content: normalizedContent, updatedAt });
        }}
        onActionCreateStickyNote={async (content, x, y) => {
          if (!activeNoteId) return;
          const fresh = createStickyNote(activeNoteId, {
            content: content || "",
            x: x ?? 150,
            y: y ?? 160,
          });
          setStickyNotes((prev) => [...prev, fresh]);
          await docbookDb.stickyNotes.put(fresh);
        }}
        onActionUpdateStickyNote={async (stickyId, content) => {
          setStickyNotes((prev) =>
            prev.map((note) => (note.id === stickyId ? { ...note, content } : note))
          );
          await docbookDb.stickyNotes.update(stickyId, { content });
        }}
        onActionChangeTheme={async (color) => {
          if (!activeNoteId) return;
          // using handleUpdateNote directly here simulates user action
          const updates = { color };
          setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? { ...n, ...updates } : n)));
          await docbookDb.notes.update(activeNoteId, updates);
        }}
      />

      {aiDocumentWriting ? (
        <IconButton
          ref={aiCancelButtonRef}
          onClick={cancelAiDraftWrite}
          sx={{
            position: "fixed",
            top: { xs: 14, md: 18 },
            right: { xs: 14, md: 18 },
            zIndex: 2600,
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(20,18,16,0.12)",
            boxShadow: "0 18px 42px rgba(20,18,16,0.16)",
            color: "#2e241d",
            "&:hover": {
              background: "rgba(255,255,255,1)",
            },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      ) : null}

      <FeedbackAdminPanel
        open={feedbackAdminOpen}
        onClose={() => setFeedbackAdminOpen(false)}
        adminKey={feedbackAdminEnabled ? "rajan" : ""}
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

      <ShareNoteModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        note={activeNote}
        onShareSaved={(noteId, shareLink) => {
          void persistNoteShareLink(noteId, shareLink);
        }}
        onShareRemoved={(noteId) => {
          void persistNoteShareLink(noteId, null);
        }}
      />

      {/* Customization Panel */}
      <CustomizationPanel
        open={customizationPanelOpen}
        onClose={() => setCustomizationPanelOpen(false)}
        notes={notes}
        onImportNotes={handleImportNotes}
        people={customPeople}
        folders={customFolders}
        locations={customLocations}
        selectedEmojis={customEmojis}
        onPeopleChange={setCustomPeople}
        onFoldersChange={setCustomFolders}
        onLocationsChange={setCustomLocations}
        onEmojisChange={setCustomEmojis}
      />

      <DocbookCircleToEditOverlay
        active={circleToEditMode}
        editorRef={editorRef}
        onCancel={() => {
          setCircleToEditMode(false);
          setAiPanelOpen(true);
        }}
        onSelectionFound={() => {
          setCircleToEditMode(false);
          setAiPanelOpen(true);
          window.requestAnimationFrame(updateSelectionMenuPosition);
        }}
      />
    </Box>
  );
}
