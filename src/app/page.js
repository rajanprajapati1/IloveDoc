"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper } from "@mui/material";
import DocbookEditorSurface from "@/components/docbook/DocbookEditorSurface";
import DocbookOverlays from "@/components/docbook/DocbookOverlays";
import DocbookSidebar from "@/components/docbook/DocbookSidebar";
import SettingsPanel from "@/components/docbook/SettingsPanel";
import SelectionPanel from "@/components/docbook/SelectionPanel";
import { buildId, createNote, isExpiredDelete } from "@/components/docbook/shared";
import { docbookDb } from "../lib/docbookDb";

export default function Home() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const objectUrlMapRef = useRef({});
  const autoSyncTimerRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState("");
  const [ready, setReady] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState({ visible: false, x: 0, y: 0 });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [linkAnchorEl, setLinkAnchorEl] = useState(null);
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
  const [selectionContent, setSelectionContent] = useState("");

  const activeNotes = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);
  const deletedNotes = useMemo(() => notes.filter((note) => note.deletedAt && !isExpiredDelete(note.deletedAt)), [notes]);
  const activeNote = useMemo(() => activeNotes.find((note) => note.id === activeNoteId) || activeNotes[0] || null, [activeNotes, activeNoteId]);

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
          if (next.title === note.title && next.content === note.content) return note;
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
      await docbookDb.transaction("rw", docbookDb.notes, docbookDb.images, async () => {
        await docbookDb.notes.delete(noteId);
        await docbookDb.images.where("noteId").equals(noteId).delete();
      });
    },
    []
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
      let storedNotes = await docbookDb.notes.orderBy("updatedAt").reverse().toArray();

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
        const first = createNote();
        await docbookDb.notes.put(first);
        storedNotes = [...storedNotes, first];
      }

      const activeMeta = await docbookDb.meta.get("activeNoteId");
      const preferred = activeMeta?.value;
      const availableNotes = storedNotes.filter((n) => !n.deletedAt);
      const initialActiveId = availableNotes.some((note) => note.id === preferred) ? preferred : availableNotes[0]?.id || "";

      if (cancelled) return;

      setNotes(storedNotes);
      setActiveNoteId(initialActiveId);
      setReady(true);
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
    if (!ready || notes.length === 0) return;
    const timeoutId = setTimeout(() => {
      void docbookDb.notes.bulkPut(notes);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [ready, notes]);

  useEffect(() => {
    if (!activeNote && activeNotes.length > 0) setActiveNoteId(activeNotes[0].id);
  }, [activeNote, notes]);

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
            }));

            await fetch("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin: settings.pin, notes: notesToSync }),
            });

            const now = new Date().toISOString();
            const updated = { ...settings, lastSyncAt: now };
            localStorage.setItem("docbook_sync_settings", JSON.stringify(updated));
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
    <Box sx={{ height: "100vh", width: "100%", overflow: "hidden" }}>
      <Paper sx={{ width: "100%", height: "100%", border: "1px solid #ddd4ca", bgcolor: "#f8f5f0", boxShadow: "0 30px 90px rgba(114, 94, 68, 0.12)", overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "228px minmax(0, 1fr)" }, height: "100%", alignItems: "stretch", minHeight: 0 }}>
          <DocbookSidebar
            notes={activeNotes}
            deletedNotes={deletedNotes}
            activeNoteId={activeNote?.id}
            showDeleted={showDeleted}
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
          />

          <DocbookEditorSurface
            activeNote={activeNote}
            editorRef={editorRef}
            imageUrlMap={imageUrlMap}
            onTitleChange={(event) => updateCurrentNote((note) => ({ ...note, title: event.target.value }))}
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
          />
        </Box>

        <DocbookOverlays
          selectionMenu={selectionMenu}
          captureSelectionRange={captureSelectionRange}
          onHighlight={handleHighlight}
          onClear={handleClear}
          runCommand={runCommand}
          restoreSelectionRange={restoreSelectionRange}
          colorAnchorEl={colorAnchorEl}
          setColorAnchorEl={setColorAnchorEl}
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
    </Box>
  );
}
