"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LocalLinter, binaryInlined } from "harper.js";

/**
 * Hook that integrates HarperJS for grammar checking.
 * 
 * @param {Object} params
 * @param {Object} params.editorRef - Ref to the contentEditable element
 */
export default function useGrammarChecker({ editorRef }) {
  const [linter, setLinter] = useState(null);
  const [lints, setLints] = useState([]);
  const [mappedLints, setMappedLints] = useState([]);

  const mappingRef = useRef([]);
  const textRef = useRef("");
  const debounceTimerRef = useRef(null);
  const lintRequestIdRef = useRef(0);

  // Initialize HarperJS
  useEffect(() => {
    let mounted = true;
    const initLinter = async () => {
      try {
        const newLinter = new LocalLinter({ binary: binaryInlined });
        await newLinter.setup();
        if (mounted) {
          setLinter(newLinter);
        }
      } catch (err) {
        console.error("Failed to initialize HarperJS:", err);
      }
    };
    initLinter();
    return () => {
      mounted = false;
    };
  }, []);

  const clearLints = useCallback(() => {
    lintRequestIdRef.current += 1;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    textRef.current = "";
    mappingRef.current = [];
    setLints([]);
    setMappedLints([]);
  }, []);

  // Extract text and mappings from DOM
  const extractTextWithMapping = useCallback((rootNode) => {
    let text = "";
    const mapping = [];

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.nodeValue;
        const start = text.length;
        text += content;
        mapping.push({ node, start, end: text.length });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const isBlock = ["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI"].includes(node.tagName);
        if (isBlock && text.length > 0 && !text.endsWith("\n")) {
          text += "\n";
        }

        if (node.tagName === "BR") {
          text += "\n";
        } else {
          // exclude special UI nodes that shouldn't be grammar checked
          if (node.getAttribute("data-highlight") === "true" ||
            node.getAttribute("data-img-ref") === "true" ||
            node.getAttribute("data-user-mention") !== null ||
            node.getAttribute("data-folder-ref") !== null) {
            // maybe we skip checking text inside these tokens?
            // Actually it's probably better to just treat their text as normal text so offsets align, 
            // but Harper might flag names. We'll leave it as normal text for simplicity.
          }

          for (let i = 0; i < node.childNodes.length; i++) {
            traverse(node.childNodes[i]);
          }
        }

        if (isBlock && text.length > 0 && !text.endsWith("\n")) {
          text += "\n";
        }
      }
    }

    traverse(rootNode);
    return { text, mapping };
  }, []);

  // Maps character offsets to DOM ClientRects
  const getRectsForRange = useCallback((startOffset, endOffset, mapping, containerRect) => {
    const ranges = [];
    for (const m of mapping) {
      if (m.end <= startOffset) continue; // too early
      if (m.start >= endOffset) break; // too late

      const nodeStart = Math.max(0, startOffset - m.start);
      // Ensure we don't exceed the actual text node's length locally
      const nodeEnd = Math.min(m.node.nodeValue.length, endOffset - m.start);

      if (nodeStart < nodeEnd) {
        ranges.push({ node: m.node, start: nodeStart, end: nodeEnd });
      }
    }

    const rects = [];
    for (const r of ranges) {
      const domRange = document.createRange();
      try {
        domRange.setStart(r.node, r.start);
        domRange.setEnd(r.node, r.end);
        const clientRects = Array.from(domRange.getClientRects());
        // Transform the client rects to relative coordinates within the editor container
        for (const cRect of clientRects) {
          rects.push({
            top: cRect.top - containerRect.top + editorRef.current.scrollTop,
            left: cRect.left - containerRect.left + editorRef.current.scrollLeft,
            width: cRect.width,
            height: cRect.height,
          });
        }
      } catch (e) {
        // ignore range errors
      }
    }
    return rects;
  }, [editorRef]);

  // Linting routine
  const runLint = useCallback(async () => {
    if (!linter || !editorRef.current) return;
    const requestId = lintRequestIdRef.current + 1;
    lintRequestIdRef.current = requestId;

    const { text, mapping } = extractTextWithMapping(editorRef.current);
    textRef.current = text;
    mappingRef.current = mapping;

    try {
      const results = await linter.lint(text, { language: "plaintext" });
      if (lintRequestIdRef.current !== requestId) return;
      setLints(results);

      // Map results immediately to coordinates
      const containerRect = editorRef.current.getBoundingClientRect();
      const mapped = results.reduce((acc, lint) => {
        try {
          const span = lint.span();
          const rects = getRectsForRange(span.start, span.end, mapping, containerRect);
          acc.push({
            span: { start: span.start, end: span.end },
            rects,
            message: lint.message(),
            lint_kind: lint.lint_kind(),
            suggestions: lint.suggestions().map(s => ({
              replacement_text: s.get_replacement_text(),
              kind: s.kind()
            }))
          });
        } catch (e) {
          // ignore mapping errors for individual lints
        }
        return acc;
      }, []);
      setMappedLints(mapped);
    } catch (err) {
      console.error("Linting failed:", err);
    }
  }, [linter, editorRef, extractTextWithMapping, getRectsForRange]);

  // Debounce the linting when triggered manually
  const triggerLint = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      runLint();
    }, 600);
  }, [runLint]);

  // An update map function call to reposition rects when scrolling or resizing
  const updateRects = useCallback(() => {
    if (!editorRef.current || lints.length === 0) return;
    const containerRect = editorRef.current.getBoundingClientRect();
    const mapped = lints.reduce((acc, lint) => {
      try {
        const span = lint.span();
        const rects = getRectsForRange(span.start, span.end, mappingRef.current, containerRect);
        acc.push({
          span: { start: span.start, end: span.end },
          rects,
          message: lint.message(),
          lint_kind: lint.lint_kind(),
          suggestions: lint.suggestions().map(s => ({
            replacement_text: s.get_replacement_text(),
            kind: s.kind()
          }))
        });
      } catch (e) {
         // ignore
      }
      return acc;
    }, []);
    setMappedLints(mapped);
  }, [lints, editorRef, getRectsForRange]);

  // Apply suggestion
  const applySuggestion = useCallback((lint, replacement) => {
    if (!editorRef.current) return;

    // Find the text nodes to replace
    const startOffset = lint.span.start;
    const endOffset = lint.span.end;
    const mapping = mappingRef.current;

    const ranges = [];
    for (const m of mapping) {
      if (m.end <= startOffset) continue;
      if (m.start >= endOffset) break;
      const nodeStart = Math.max(0, startOffset - m.start);
      const nodeEnd = Math.min(m.node.nodeValue.length, endOffset - m.start);
      if (nodeStart < nodeEnd) {
        ranges.push({ node: m.node, start: nodeStart, end: nodeEnd });
      }
    }

    if (ranges.length === 0) return;

    // Use Selection API to select the exact text and replace it so undo history is preserved
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const domRange = document.createRange();
      try {
        domRange.setStart(ranges[0].node, ranges[0].start);
        domRange.setEnd(ranges[ranges.length - 1].node, ranges[ranges.length - 1].end);
        sel.addRange(domRange);

        // Ensure the editor has focus before running execCommand, otherwise it might fail
        if (document.activeElement !== editorRef.current) {
          editorRef.current.focus();
        }

        // Execute text replacement (leaves an undo step in standard contenteditables)
        document.execCommand("insertText", false, replacement);

        // Immediately trigger a re-lint
        runLint();
      } catch (e) {
        console.error("Failed to apply suggestion", e);
      }
    }
  }, [editorRef, runLint]);

  return { lints, mappedLints, applySuggestion, updateRects, triggerLint, clearLints };
}
