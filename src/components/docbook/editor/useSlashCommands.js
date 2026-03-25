"use client";

import { useState, useCallback } from "react";
import { createTodoHtml } from "../shared";

const TOP_LEVEL_COMMANDS = [
  {
    id: "command-note",
    kind: "command",
    command: "note",
    label: "Sticky Note",
    description: "Create or open a pinned note",
  },
  {
    id: "command-date",
    kind: "command",
    command: "date",
    label: "Date",
    description: "Insert today's date or pick one",
  },
  {
    id: "command-time",
    kind: "command",
    command: "time",
    label: "Time",
    description: "Insert the current time",
  },
  {
    id: "command-todo",
    kind: "command",
    command: "todo",
    label: "Todo",
    description: "Add checkable tasks",
  },
  {
    id: "command-map",
    kind: "command",
    command: "map",
    label: "Location",
    description: "Pin a place on the map",
  },
];

/**
 * Hook for slash command logic (/note, /date, /time, /todo, /map).
 *
 * @param {Object} params
 * @param {Object|null} params.activeNote
 * @param {Array}  params.stickyNotes
 * @param {Function} params.onEditorInput
 * @param {Function} params.onAddStickyNote
 * @param {Function} params.onOpenStickyNote
 */
export default function useSlashCommands({
  activeNote,
  stickyNotes = [],
  onEditorInput,
  onAddStickyNote,
  onOpenStickyNote,
  customLocations = [],
}) {
  const [slashMenu, setSlashMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    query: "",
    selectedIndex: 0,
    token: "",
    command: "",
    argument: "",
    title: "Commands",
  });

  const getDateSuggestions = useCallback((query) => {
    const today = new Date();

    const getFormatsForDate = (date) => [
      date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    ];

    let targetDate = new Date(today);
    let dateLabelPrefix = "";

    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("tom")) {
      targetDate.setDate(today.getDate() + 1);
      dateLabelPrefix = "Tomorrow";
    } else if (lowerQuery.includes("yes")) {
      targetDate.setDate(today.getDate() - 1);
      dateLabelPrefix = "Yesterday";
    } else {
      let match = lowerQuery.match(/(\d+)\s*d(?:ay(?:s)?)?\s*ago/);
      if (match) {
        targetDate.setDate(today.getDate() - parseInt(match[1], 10));
        dateLabelPrefix = `${match[1]} Days Ago`;
      } else {
        match = lowerQuery.match(/in\s*(\d+)\s*d(?:ay(?:s)?)?/);
        if (match) {
          targetDate.setDate(today.getDate() + parseInt(match[1], 10));
          dateLabelPrefix = `In ${match[1]} Days`;
        } else if (!lowerQuery.trim()) {
          dateLabelPrefix = "Today";
        }
      }
    }

    return getFormatsForDate(targetDate).map((format, index) => ({
      id: `date-${index}`,
      kind: "date",
      label: format,
      description: dateLabelPrefix ? `${dateLabelPrefix} (${format})` : format,
      value: format,
    }));
  }, []);

  const getTimeSuggestions = useCallback(() => {
    const now = new Date();
    const formats = [
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    ];

    return formats.map((format, index) => ({
      id: `time-${index}`,
      kind: "time",
      label: format,
      description: `Current time (${format})`,
      value: format,
    }));
  }, []);

  const getSlashCommandContext = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;

    const node = sel.anchorNode;
    if (!node || node.nodeType !== 3) return null;

    const beforeText = node.textContent?.slice(0, sel.anchorOffset) || "";
    const match = beforeText.match(/(?:^|\s)(\/[a-z]*(?:\s+[^\n\r]*)?)$/i);
    if (!match) return null;

    const caretRange = sel.getRangeAt(0).cloneRange();
    caretRange.collapse(true);
    const rect = caretRange.getBoundingClientRect();
    const token = match[1];
    const startIndex = beforeText.lastIndexOf(token);
    const tokenBody = token.slice(1);
    const firstSpaceIndex = tokenBody.indexOf(" ");
    const command = (firstSpaceIndex === -1 ? tokenBody : tokenBody.slice(0, firstSpaceIndex)).toLowerCase();
    const argument = firstSpaceIndex === -1 ? "" : tokenBody.slice(firstSpaceIndex + 1);

    return {
      textNode: node,
      token,
      startIndex,
      endIndex: startIndex + token.length,
      rect,
      command,
      argument,
    };
  }, []);

  const getCommandSuggestions = useCallback((commandQuery) => {
    const cleanQuery = commandQuery.trim().toLowerCase();
    return TOP_LEVEL_COMMANDS.filter((item) => !cleanQuery || item.command.startsWith(cleanQuery));
  }, []);

  const getActiveSuggestions = useCallback(() => {
    const command = slashMenu.command;
    const argument = slashMenu.argument.trim();

    if (!command) {
      return {
        title: "Commands",
        items: getCommandSuggestions(""),
      };
    }

    const exactCommand = TOP_LEVEL_COMMANDS.find((item) => item.command === command);
    if (!exactCommand) {
      return {
        title: "Commands",
        items: getCommandSuggestions(command),
      };
    }

    if (command === "note") {
      return {
        title: "Sticky Notes",
        items: [
          { id: "create-sticky-note", kind: "create", label: "Create sticky note", description: "Open a new sticky note for this page" },
          ...stickyNotes
            .filter((note) => note.noteId === activeNote?.id)
            .map((note) => ({
              id: note.id,
              kind: "existing",
              label: note.title?.trim() || "Untitled sticky note",
              description: "Open existing sticky note",
            })),
        ],
      };
    }

    if (command === "date") {
      return {
        title: "Date Formats",
        items: getDateSuggestions(argument),
      };
    }

    if (command === "time") {
      return {
        title: "Time Formats",
        items: getTimeSuggestions(),
      };
    }

    if (command === "todo") {
      return {
        title: "Todo Options",
        items: [
          { id: "todo-1", kind: "todo", label: "Insert 1 Todo", description: "Add a single todo checkbox", count: 1 },
          { id: "todo-3", kind: "todo", label: "Insert 3 Todos", description: "Add three todo checkboxes", count: 3 },
          { id: "todo-5", kind: "todo", label: "Insert 5 Todos", description: "Add five todo checkboxes", count: 5 },
        ],
      };
    }

    if (command === "map") {
      const matches = customLocations.filter((loc) => {
        if (!argument) return true;
        return (
          loc.name.toLowerCase().includes(argument.toLowerCase()) ||
          loc.address.toLowerCase().includes(argument.toLowerCase())
        );
      });

      const items = matches.map((loc) => ({
        id: `map-loc-${loc.id}`,
        kind: "map",
        label: `Location: ${loc.name}`,
        description: loc.address || loc.description || "Custom location",
        value: loc.name,
      }));

      if (argument && !matches.some((loc) => loc.name.toLowerCase() === argument.toLowerCase())) {
        items.unshift({
          id: "map-pin",
          kind: "map",
          label: `Location: ${argument}`,
          description: `Insert location: ${argument}`,
          value: argument,
        });
      }

      if (items.length === 0) {
        items.push({
          id: "map-hint",
          kind: "map",
          label: "Insert Location",
          description: "Type a place after /map",
          value: "",
        });
      }

      return {
        title: "Location",
        items,
      };
    }

    return {
      title: "Commands",
      items: getCommandSuggestions(command),
    };
  }, [activeNote?.id, getCommandSuggestions, getDateSuggestions, getTimeSuggestions, slashMenu.argument, slashMenu.command, stickyNotes, customLocations]);

  const { title: suggestionTitle, items: activeSuggestions } = getActiveSuggestions();

  const closeSlashMenu = useCallback(() => {
    setSlashMenu((prev) => (
      prev.visible
        ? { ...prev, visible: false, selectedIndex: 0, command: "", argument: "", title: "Commands" }
        : prev
    ));
  }, []);

  const refreshSlashMenu = useCallback(() => {
    const context = getSlashCommandContext();
    if (!context) {
      closeSlashMenu();
      return;
    }

    const isTopLevel = !context.command;
    const commandMatches = TOP_LEVEL_COMMANDS.some((item) => item.command.startsWith(context.command));
    if (!isTopLevel && !commandMatches) {
      closeSlashMenu();
      return;
    }

    setSlashMenu((prev) => ({
      visible: true,
      x: context.rect.left,
      y: context.rect.bottom + 10,
      query: context.token.toLowerCase(),
      token: context.token,
      command: context.command,
      argument: context.argument,
      title: suggestionTitle,
      selectedIndex: prev.token === context.token ? prev.selectedIndex : 0,
    }));
  }, [closeSlashMenu, getSlashCommandContext, suggestionTitle]);

  const replaceSlashToken = useCallback((context, nextValue, keepMenuOpen = false) => {
    if (!context?.textNode) return;

    const currentText = context.textNode.textContent || "";
    const newTextContent = `${currentText.slice(0, context.startIndex)}${nextValue}${currentText.slice(context.endIndex)}`;
    context.textNode.textContent = newTextContent;

    const nextRange = document.createRange();
    const nextSelection = window.getSelection();
    const cursorOffset = context.startIndex + nextValue.length;

    nextRange.setStart(context.textNode, Math.min(cursorOffset, context.textNode.textContent.length));
    nextRange.collapse(true);
    nextSelection?.removeAllRanges();
    nextSelection?.addRange(nextRange);

    if (onEditorInput) onEditorInput();

    if (keepMenuOpen) {
      window.requestAnimationFrame(() => {
        refreshSlashMenu();
      });
      return;
    }

    closeSlashMenu();
  }, [closeSlashMenu, onEditorInput, refreshSlashMenu]);

  const applySlashSuggestion = useCallback((item) => {
    const context = getSlashCommandContext();

    if (item.kind === "command") {
      replaceSlashToken(context, `/${item.command} `, true);
      return;
    }

    if (item.kind === "date" || item.kind === "time") {
      replaceSlashToken(context, item.value);
      return;
    }

    if (context?.textNode) {
      replaceSlashToken(context, "");
    } else {
      closeSlashMenu();
      if (onEditorInput) onEditorInput();
    }

    if (item.kind === "todo") {
      const count = item.count || 1;
      const singleTodo = createTodoHtml();
      document.execCommand("insertHTML", false, singleTodo.repeat(count));
      if (onEditorInput) onEditorInput();
      return;
    }

    if (item.kind === "map" && item.value) {
      const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.value)}`;
      const mapHtml = `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" data-location="${item.value.replace(/"/g, "&quot;")}" style="display:inline-flex;align-items:center;gap:0.3em;vertical-align:middle;border-radius:999px;padding:0.18em 0.6em;margin:0 0.1em;background:rgba(255,248,240,0.96);border:1px solid rgba(139,94,60,0.22);box-shadow:0 2px 8px rgba(92,61,46,0.1);color:#3e2f24;text-decoration:none;line-height:1.4;font-size:0.88em;font-weight:600;cursor:pointer;">Location ${item.value}</a>&nbsp;`;
      document.execCommand("insertHTML", false, mapHtml);
      if (onEditorInput) onEditorInput();
      return;
    }

    if (item.kind === "create") {
      onAddStickyNote?.();
      return;
    }

    if (item.kind === "existing") {
      onOpenStickyNote?.(item.id);
    }
  }, [closeSlashMenu, getSlashCommandContext, onAddStickyNote, onEditorInput, onOpenStickyNote, replaceSlashToken]);

  return {
    slashMenu: { ...slashMenu, title: suggestionTitle },
    setSlashMenu,
    activeSuggestions,
    getDateSuggestions,
    getTimeSuggestions,
    closeSlashMenu,
    refreshSlashMenu,
    applySlashSuggestion,
  };
}
