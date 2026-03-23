"use client";

import { useState, useCallback } from "react";
import { alpha } from "@mui/material/styles";
import { buildId } from "../shared";

/**
 * Hook for @mention and #folder token suggestion logic.
 *
 * @param {Object} params
 * @param {Array}  params.customPeople
 * @param {Array}  params.customFolders
 * @param {Function} params.onEditorInput
 * @param {Function} params.onPeopleChange
 * @param {Function} params.onFoldersChange
 */
export default function useTokenSuggestions({
  customPeople = [],
  customFolders = [],
  customLocations = [],
  onEditorInput,
  onPeopleChange,
  onFoldersChange,
  onLocationsChange,
}) {
  const [tokenMenu, setTokenMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    query: "",
    selectedIndex: 0,
    token: "",
    tokenType: "",
  });

  /* ── Computed suggestions ── */
  const activeTokenSuggestions = (() => {
    if (!tokenMenu.visible) return [];

    const normalizedQuery = tokenMenu.query.toLowerCase().trim();

    if (tokenMenu.tokenType === "mention") {
      const matches = customPeople.filter((person) => {
        if (!normalizedQuery) return true;
        return (
          person.name.toLowerCase().includes(normalizedQuery) ||
          person.handle.toLowerCase().includes(normalizedQuery) ||
          person.role.toLowerCase().includes(normalizedQuery)
        );
      });
      if (!normalizedQuery && matches.length === 0) {
        matches.push({ id: "__mention_hint__", name: "Type a name to create or search", handle: "", role: "No people added yet", accent: "#8b5e3c", __isHint: true });
      }
      if (normalizedQuery && !customPeople.some((p) => p.handle.toLowerCase() === normalizedQuery || p.name.toLowerCase() === normalizedQuery)) {
        matches.push({ id: "__create_person__", name: normalizedQuery, handle: normalizedQuery, role: "", accent: "#8b5e3c", __isCreate: true });
      }
      return matches;
    }

    if (tokenMenu.tokenType === "folder") {
      const matches = customFolders.filter((folder) => {
        if (!normalizedQuery) return true;
        return (
          folder.name.toLowerCase().includes(normalizedQuery) ||
          folder.path.toLowerCase().includes(normalizedQuery) ||
          folder.description.toLowerCase().includes(normalizedQuery)
        );
      });
      if (!normalizedQuery && matches.length === 0) {
        matches.push({ id: "__folder_hint__", name: "Type a path to create or search", path: "", description: "No folders added yet", accent: "#6d4c41", __isHint: true });
      }
      if (normalizedQuery && !customFolders.some((f) => f.path.toLowerCase() === normalizedQuery || f.name.toLowerCase() === normalizedQuery)) {
        matches.push({ id: "__create_folder__", name: normalizedQuery, path: normalizedQuery, description: "", accent: "#6d4c41", __isCreate: true });
      }
      return matches;
    }

    if (tokenMenu.tokenType === "location") {
      const matches = customLocations.filter((loc) => {
        if (!normalizedQuery) return true;
        return (
          loc.name.toLowerCase().includes(normalizedQuery) ||
          loc.address.toLowerCase().includes(normalizedQuery) ||
          loc.description.toLowerCase().includes(normalizedQuery)
        );
      });
      if (!normalizedQuery && matches.length === 0) {
        matches.push({ id: "__location_hint__", name: "Type a name to create or search", address: "", description: "No locations added yet", accent: "#0ea5e9", __isHint: true });
      }
      if (normalizedQuery && !customLocations.some((l) => l.name.toLowerCase() === normalizedQuery)) {
        matches.push({ id: "__create_location__", name: normalizedQuery, address: "", description: "", accent: "#0ea5e9", __isCreate: true });
      }
      return matches;
    }

    return [];
  })();

  /* ── Context detection ── */
  const getTokenContext = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;

    const node = sel.anchorNode;
    if (!node || node.nodeType !== 3) return null;

    const beforeText = node.textContent?.slice(0, sel.anchorOffset) || "";
    const match = beforeText.match(/(^|\s)([@#!])([a-z0-9_./-\s]*)$/i);
    if (!match) return null;

    const prefix = match[2];
    const query = match[3] || "";
    const token = `${prefix}${query}`;
    const startIndex = beforeText.length - token.length;

    const caretRange = sel.getRangeAt(0).cloneRange();
    caretRange.collapse(true);
    const rect = caretRange.getBoundingClientRect();

    return { textNode: node, prefix, query, token, startIndex, endIndex: startIndex + token.length, rect };
  }, []);

  const closeTokenMenu = useCallback(() => {
    setTokenMenu((prev) => (prev.visible ? { ...prev, visible: false, selectedIndex: 0 } : prev));
  }, []);

  const refreshTokenMenu = useCallback(() => {
    const context = getTokenContext();
    if (!context) {
      closeTokenMenu();
      return;
    }

    const tokenType = context.prefix === "@" ? "mention" : context.prefix === "#" ? "folder" : context.prefix === "!" ? "location" : "";
    if (!tokenType) {
      closeTokenMenu();
      return;
    }

    setTokenMenu((prev) => ({
      visible: true,
      x: context.rect.left,
      y: context.rect.bottom + 10,
      query: context.query,
      token: context.token,
      tokenType,
      selectedIndex: prev.token === context.token && prev.tokenType === tokenType ? prev.selectedIndex : 0,
    }));
  }, [closeTokenMenu, getTokenContext]);

  /* ── Apply suggestion ── */
  const applyTokenSuggestion = useCallback(
    (item) => {
      if (item.__isHint) return;

      const context = getTokenContext();
      if (!context?.textNode) return;

      let resolvedItem = item;
      if (item.__isCreate && tokenMenu.tokenType === "mention") {
        const newPerson = { id: buildId(), name: item.name, handle: item.handle, role: "", accent: "#8b5e3c" };
        resolvedItem = newPerson;
        const updatedPeople = [...customPeople, newPerson];
        localStorage.setItem("docbook_custom_people", JSON.stringify(updatedPeople));
        onPeopleChange?.(updatedPeople);
      } else if (item.__isCreate && tokenMenu.tokenType === "folder") {
        const newFolder = { id: buildId(), name: item.name, path: item.path, description: "", accent: "#6d4c41" };
        resolvedItem = newFolder;
        const updatedFolders = [...customFolders, newFolder];
        localStorage.setItem("docbook_custom_folders", JSON.stringify(updatedFolders));
        onFoldersChange?.(updatedFolders);
      } else if (item.__isCreate && tokenMenu.tokenType === "location") {
        const newLoc = { id: buildId(), name: item.name, address: "", description: "", accent: "#0ea5e9" };
        resolvedItem = newLoc;
        const updatedLocations = [...customLocations, newLoc];
        localStorage.setItem("docbook_custom_locations", JSON.stringify(updatedLocations));
        onLocationsChange?.(updatedLocations);
      }

      const selection = window.getSelection();
      const replaceRange = document.createRange();
      replaceRange.setStart(context.textNode, context.startIndex);
      replaceRange.setEnd(context.textNode, context.endIndex);

      const chip = document.createElement("span");
      chip.contentEditable = "false";

      if (tokenMenu.tokenType === "mention") {
        chip.setAttribute("data-user-mention", resolvedItem.id);
        chip.setAttribute("data-user-name", resolvedItem.name);
        chip.setAttribute("data-user-handle", resolvedItem.handle);
        chip.setAttribute("data-user-role", resolvedItem.role);

        const avatar = document.createElement("span");
        avatar.setAttribute("data-chip-avatar", "true");
        avatar.style.background = `linear-gradient(135deg, ${alpha(resolvedItem.accent, 0.95)} 0%, ${alpha(resolvedItem.accent, 0.72)} 100%)`;
        avatar.textContent = resolvedItem.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

        const content = document.createElement("span");
        content.setAttribute("data-chip-content", "true");

        const primary = document.createElement("span");
        primary.setAttribute("data-chip-primary", "true");
        primary.textContent = resolvedItem.name;

        const secondaryRow = document.createElement("span");
        secondaryRow.setAttribute("data-chip-secondary-row", "true");

        const secondary = document.createElement("span");
        secondary.setAttribute("data-chip-secondary", "true");
        secondary.textContent = `@${resolvedItem.handle}`;

        const dot = document.createElement("span");
        dot.setAttribute("data-chip-dot", "true");

        secondaryRow.append(secondary, dot);
        content.append(primary, secondaryRow);
        chip.append(avatar, content);
      } else if (tokenMenu.tokenType === "location") {
        chip.setAttribute("data-location-ref", resolvedItem.id);
        chip.setAttribute("data-location-name", resolvedItem.name);
        chip.setAttribute("data-location-address", resolvedItem.address);
        chip.setAttribute("data-location-description", resolvedItem.description);

        const icon = document.createElement("span");
        icon.setAttribute("data-chip-location-icon", "true");
        icon.textContent = "📍";

        const label = document.createElement("span");
        label.setAttribute("data-chip-label", "true");
        label.textContent = resolvedItem.name;

        chip.append(icon, label);
      }
      else {
        chip.setAttribute("data-folder-ref", resolvedItem.id);
        chip.setAttribute("data-folder-name", resolvedItem.name);
        chip.setAttribute("data-folder-path", resolvedItem.path);
        chip.setAttribute("data-folder-description", resolvedItem.description);

        const icon = document.createElement("span");
        icon.setAttribute("data-chip-folder-icon", "true");
        icon.textContent = "#";

        const label = document.createElement("span");
        label.setAttribute("data-chip-label", "true");
        label.textContent = resolvedItem.path;

        chip.append(icon, label);
      }

      const spacer = document.createTextNode("\u00A0");
      const fragment = document.createDocumentFragment();
      fragment.append(chip, spacer);
      replaceRange.deleteContents();
      replaceRange.insertNode(fragment);

      const nextRange = document.createRange();
      nextRange.setStart(spacer, spacer.textContent.length);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);

      if (onEditorInput) onEditorInput();
      closeTokenMenu();
    },
    [closeTokenMenu, getTokenContext, onEditorInput, tokenMenu.tokenType, customPeople, customFolders, customLocations, onPeopleChange, onFoldersChange, onLocationsChange]
  );

  return {
    tokenMenu,
    setTokenMenu,
    activeTokenSuggestions,
    closeTokenMenu,
    refreshTokenMenu,
    applyTokenSuggestion,
  };
}
