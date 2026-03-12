"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import { tooltipSlotProps } from "./shared";

export default function SelectionPanel({
  editorRef,
  imageUrlMap = {},
  selectionContent,
  onClose,
  visible,
}) {
  const [activeImageId, setActiveImageId] = useState(null);
  const panelRef = useRef(null);

  /* Parse the selectionContent to extract text and associated images */
  const { textSegments, imageRefs } = useMemo(() => {
    const allImages = [];

    /* Get labels from the editor DOM for each image */
    const editor = editorRef?.current;
    if (editor) {
      const imgSpans = editor.querySelectorAll("[data-img-ref]");
      imgSpans.forEach((span) => {
        const id = span.getAttribute("data-img-ref");
        const label = span.getAttribute("data-img-label") || span.textContent?.trim() || "Image";
        const url = imageUrlMap[id];
        if (id && url) {
          allImages.push({ id, url, label });
        }
      });
    }

    /* Also include images from imageUrlMap that aren't in the DOM (e.g. drag-dropped without token) */
    const domIds = new Set(allImages.map((i) => i.id));
    for (const [id, url] of Object.entries(imageUrlMap)) {
      if (!domIds.has(id)) {
        allImages.push({ id, url, label: "Attached image" });
      }
    }

    return { textSegments: [], imageRefs: allImages };
  }, [selectionContent, imageUrlMap, editorRef]);

  /* Highlight an image token in the editor */
  const highlightInEditor = useCallback(
    (imageId) => {
      const editor = editorRef?.current;
      if (!editor) return;

      /* Remove previous highlights */
      editor.querySelectorAll("[data-selection-highlight]").forEach((el) => {
        el.removeAttribute("data-selection-highlight");
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
        el.style.removeProperty("border-radius");
        el.style.removeProperty("animation");
      });

      if (activeImageId === imageId) {
        setActiveImageId(null);
        return;
      }

      /* Find the image span in editor */
      const imgSpan = editor.querySelector(`[data-img-ref="${imageId}"]`);
      if (imgSpan) {
        imgSpan.setAttribute("data-selection-highlight", "true");
        imgSpan.style.outline = "3px solid #c4956a";
        imgSpan.style.outlineOffset = "3px";
        imgSpan.style.borderRadius = "8px";

        /* Scroll into view */
        imgSpan.scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveImageId(imageId);

        /* Auto-remove after 3s */
        setTimeout(() => {
          imgSpan.removeAttribute("data-selection-highlight");
          imgSpan.style.removeProperty("outline");
          imgSpan.style.removeProperty("outline-offset");
          imgSpan.style.removeProperty("border-radius");
          setActiveImageId(null);
        }, 3000);
      }
    },
    [editorRef, activeImageId]
  );

  if (!visible) return null;

  return (
    <Box
      ref={panelRef}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: { xs: "100%", sm: 340 },
        height: "100vh",
        bgcolor: "#faf7f3",
        borderLeft: "1px solid #e6ddd3",
        boxShadow: "-8px 0 32px rgba(58, 46, 34, 0.12)",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e7dfd5",
          background: "linear-gradient(135deg, #f0e6d8 0%, #f8f0e6 100%)",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ImageRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>
            Selection & Images
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#6a6054", "&:hover": { bgcolor: alpha("#8f7d66", 0.12) } }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Scroll content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          px: 2.5,
          py: 2,
          scrollbarWidth: "thin",
          scrollbarColor: "#d4c4b0 transparent",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#d4c4b0", borderRadius: 3 },
        }}
      >
        {/* Selection text content */}
        {selectionContent && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "#8a7d70",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 1.2,
              }}
            >
              Selected Content
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha("#f5efe7", 0.7),
                border: "1px solid",
                borderColor: alpha("#d9cab7", 0.5),
                fontSize: 13,
                lineHeight: 1.7,
                color: "#3b342d",
                fontWeight: 500,
                "& strong, & b": { fontWeight: 700 },
                "& em, & i": { fontStyle: "italic" },
                "& span[data-highlight]": {
                  borderRadius: "6px",
                  px: "0.2em",
                  py: "0.02em",
                  background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
                  color: "#fff8f0",
                  fontSize: 12,
                },
                "& span[data-img-ref]": {
                  display: "inline-flex",
                  alignItems: "center",
                  px: "0.3em",
                  py: "0.02em",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
                  color: "#fff8f0",
                  fontSize: 12,
                },
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: selectionContent }}
            />
          </Box>
        )}

        {/* Images section */}
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            color: "#8a7d70",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            mb: 1.2,
          }}
        >
          Attached Images ({imageRefs.length})
        </Typography>

        {imageRefs.length === 0 ? (
          <Box
            sx={{
              py: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              opacity: 0.5,
            }}
          >
            <ImageRoundedIcon sx={{ fontSize: 40, color: "#c4b8a6" }} />
            <Typography sx={{ fontSize: 12, color: "#9a8d7f", textAlign: "center" }}>
              No images attached to this note
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {imageRefs.map(({ id, url, label }) => (
              <Box
                key={id}
                onClick={() => highlightInEditor(id)}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: activeImageId === id ? "#c4956a" : alpha("#d9cab7", 0.6),
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  boxShadow: activeImageId === id
                    ? "0 4px 20px rgba(196, 149, 106, 0.3)"
                    : "0 2px 8px rgba(58, 46, 34, 0.06)",
                  "&:hover": {
                    borderColor: "#c4956a",
                    boxShadow: "0 4px 16px rgba(196, 149, 106, 0.2)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={label}
                  sx={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    bgcolor: activeImageId === id ? alpha("#c4956a", 0.08) : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 600, color: "#4a3f36", flex: 1, minWidth: 0 }}
                    noWrap
                  >
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#8a7d70", ml: 1 }}>
                    Click to locate
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
