import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatClearRoundedIcon from "@mui/icons-material/FormatClearRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import HighlightRoundedIcon from "@mui/icons-material/HighlightRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import FontDownloadRoundedIcon from "@mui/icons-material/FontDownloadRounded";
import TextIncreaseRoundedIcon from "@mui/icons-material/TextIncreaseRounded";
import TextDecreaseRoundedIcon from "@mui/icons-material/TextDecreaseRounded";
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { stickyColorOptions as colorOptions, normalizeUrl, tooltipSlotProps } from "./shared";

const presetFontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60, 72];
const headingOptions = [
  { label: "Paragraph", value: "p", previewSx: { fontSize: 13, fontWeight: 600 } },
  { label: "Heading 1", value: "h1", previewSx: { fontSize: 24, fontWeight: 800, lineHeight: 1.05 } },
  { label: "Heading 2", value: "h2", previewSx: { fontSize: 20, fontWeight: 800, lineHeight: 1.08 } },
  { label: "Heading 3", value: "h3", previewSx: { fontSize: 17, fontWeight: 800, lineHeight: 1.1 } },
  { label: "Heading 4", value: "h4", previewSx: { fontSize: 15, fontWeight: 800, lineHeight: 1.12 } },
  { label: "Heading 5", value: "h5", previewSx: { fontSize: 13.5, fontWeight: 800, lineHeight: 1.14 } },
  { label: "Heading 6", value: "h6", previewSx: { fontSize: 12.5, fontWeight: 800, lineHeight: 1.16 } },
];

function SelectionToolbar({ visible, x, y, onBold, onColor, onFontFamily, onFontSizeMenu, onFontSizeIncrease, onFontSizeDecrease, onHeading, onHighlight, onList, onTodo, onTable, onLink, onImage, onNote, onClear, onViewSelection }) {
  const iconSx = { color: "#352f29", "&:hover": { bgcolor: alpha("#8f7d66", 0.12) } };

  return (
    <Box sx={{ position: "fixed", top: y, left: x, transform: visible ? "translate(-50%, -100%) scale(1)" : "translate(-50%, -92%) scale(0.96)", opacity: visible ? 1 : 0, transition: "opacity 180ms ease, transform 180ms ease", pointerEvents: visible ? "auto" : "none", zIndex: 1400 }}>
      <Paper elevation={6} sx={{ borderRadius: 999, px: 0.5, py: 0.28, background: "linear-gradient(135deg, #f8efe3 0%, #f0e4d4 100%)", border: "1px solid #d9cab7", boxShadow: "0 12px 30px rgba(58, 46, 34, 0.2)" }}>
        <Stack direction="row" alignItems="center" spacing={0.2}>
          <Tooltip title="Heading / Paragraph" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onHeading} size="small" sx={iconSx}><Typography sx={{ fontSize: 13, fontWeight: 900, lineHeight: 1, color: "inherit" }}>H</Typography></IconButton></Tooltip>
          <Tooltip title="Bold" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onBold} size="small" sx={iconSx}><FormatBoldRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Text Color" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onColor} size="small" sx={iconSx}><ColorLensRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Font Family" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onFontFamily} size="small" sx={iconSx}><FontDownloadRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Font Size" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onFontSizeMenu} size="small" sx={iconSx}><Typography sx={{ fontSize: 11.5, fontWeight: 900, lineHeight: 1, color: "inherit" }}>14</Typography></IconButton></Tooltip>
          <Tooltip title="Increase Font Size" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onFontSizeIncrease} size="small" sx={iconSx}><TextIncreaseRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Decrease Font Size" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onFontSizeDecrease} size="small" sx={iconSx}><TextDecreaseRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Highlight" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onHighlight} size="small" sx={iconSx}><HighlightRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="List" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onList} size="small" sx={iconSx}><FormatListBulletedRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="To-do List" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onTodo} size="small" sx={iconSx}><CheckBoxOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Insert Table" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onTable} size="small" sx={iconSx}><TableViewRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          {/* Divider dot */}
          <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: alpha("#8f7d66", 0.3), mx: 0.3 }} />
          <Tooltip title="Add Link" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onLink} size="small" sx={iconSx}><LinkRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Attach Image" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onImage} size="small" sx={iconSx}><ImageRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          {/* <Tooltip title="Attach Note" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onNote} size="small" sx={iconSx}><StickyNote2RoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip> */}

          {/* Divider dot */}
          <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: alpha("#8f7d66", 0.3), mx: 0.3 }} />

          <Tooltip title="View Selection & Images" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onViewSelection} size="small" sx={iconSx}><ViewSidebarRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          <Tooltip title="Clear Format" arrow slotProps={tooltipSlotProps}><IconButton onMouseDown={(e) => e.preventDefault()} onClick={onClear} size="small" sx={iconSx}><FormatClearRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function DocbookOverlays({
  selectionMenu,
  captureSelectionRange,
  onHighlight,
  onClear,
  runCommand,
  onInsertTodo,
  onInsertTable,
  restoreSelectionRange,
  colorAnchorEl,
  setColorAnchorEl,
  fontFamilyAnchorEl,
  setFontFamilyAnchorEl,
  fontSizeAnchorEl,
  setFontSizeAnchorEl,
  headingAnchorEl,
  setHeadingAnchorEl,
  onFontSizeIncrease,
  onFontSizeDecrease,
  changeFontFamily,
  onApplyTextFontSize,
  onApplyBlockFormat,
  linkAnchorEl,
  setLinkAnchorEl,
  linkDraft,
  setLinkDraft,
  imageAnchorEl,
  setImageAnchorEl,
  setImageMode,
  fileInputRef,
  listMenuAnchorEl,
  setListMenuAnchorEl,
  editorRef,
  syncEditorHtml,
  noteAnchorEl,
  setNoteAnchorEl,
  noteDraft,
  setNoteDraft,
  buildId,
  attachImageToSelection,
  hoverPreview,
  onOpenSelectionPanel,
}) {
  return (
    <>
      <SelectionToolbar
        visible={selectionMenu.visible}
        x={selectionMenu.x}
        y={selectionMenu.y}
        onBold={() => runCommand("bold")}
        onColor={(event) => {
          captureSelectionRange();
          setColorAnchorEl(event.currentTarget);
        }}
        onFontFamily={(event) => {
          captureSelectionRange();
          setFontFamilyAnchorEl(event.currentTarget);
        }}
        onFontSizeMenu={(event) => {
          captureSelectionRange();
          setFontSizeAnchorEl(event.currentTarget);
        }}
        onFontSizeIncrease={onFontSizeIncrease}
        onFontSizeDecrease={onFontSizeDecrease}
        onHeading={(event) => {
          captureSelectionRange();
          setHeadingAnchorEl(event.currentTarget);
        }}
        onHighlight={onHighlight}
        onList={(event) => {
          captureSelectionRange();
          setListMenuAnchorEl(event.currentTarget);
        }}
        onTodo={() => {
          captureSelectionRange();
          if (onInsertTodo) onInsertTodo();
        }}
        onTable={() => {
          captureSelectionRange();
          if (onInsertTable) onInsertTable();
        }}
        onLink={(event) => {
          captureSelectionRange();
          setLinkAnchorEl(event.currentTarget);
        }}
        onImage={(event) => {
          captureSelectionRange();
          setImageAnchorEl(event.currentTarget);
        }}
        onNote={(event) => {
          captureSelectionRange();
          setNoteAnchorEl(event.currentTarget);
        }}
        onClear={onClear}
        onViewSelection={() => {
          captureSelectionRange();
          if (onOpenSelectionPanel) onOpenSelectionPanel();
        }}
      />

      <Popover
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={() => setColorAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: 2.2, p: 1, border: "1px solid #ddd0c0", bgcolor: "#f6eee3" } }}
      >
        <Stack direction="row" spacing={0.7}>
          {colorOptions.map((color) => (
            <IconButton
              key={color.value}
              size="small"
              onClick={() => {
                restoreSelectionRange();
                document.execCommand("styleWithCSS", false, true);
                runCommand("foreColor", color.value);
                setColorAnchorEl(null);
              }}
              sx={{ width: 24, height: 24, bgcolor: color.value, border: "1px solid rgba(0,0,0,0.16)", "&:hover": { opacity: 0.85 } }}
            />
          ))}
        </Stack>
      </Popover>

      <Menu
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        open={Boolean(fontFamilyAnchorEl)}
        anchorEl={fontFamilyAnchorEl}
        onClose={() => setFontFamilyAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 150, boxShadow: "0 12px 30px rgba(58, 46, 34, 0.18)" } }}
      >
        {[
          { label: "Default", value: "inherit" },
          { label: "Serif", value: "Georgia, serif" },
          { label: "Monospace", value: "monospace" },
          { label: "Arial", value: "Arial, sans-serif" },
          { label: "Times New Roman", value: "'Times New Roman', serif" },
          { label: "Courier New", value: "'Courier New', monospace" },
          { label: "Verdana", value: "Verdana, sans-serif" }
        ].map((font) => (
          <MenuItem
            key={font.label}
            onClick={() => {
              changeFontFamily(font.value);
              setFontFamilyAnchorEl(null);
            }}
            sx={{ fontSize: 13, color: "#3b342d", fontFamily: font.value }}
          >
            {font.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        open={Boolean(fontSizeAnchorEl)}
        anchorEl={fontSizeAnchorEl}
        onClose={() => setFontSizeAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 150, boxShadow: "0 12px 30px rgba(58, 46, 34, 0.18)" } }}
      >
        {presetFontSizes.map((fontSize) => (
          <MenuItem
            key={fontSize}
            onClick={() => {
              onApplyTextFontSize?.(fontSize);
              setFontSizeAnchorEl(null);
            }}
            sx={{ fontSize: 13, color: "#3b342d", gap: 1.2 }}
          >
            <Typography sx={{ minWidth: 36, fontSize: 12, fontWeight: 800, color: "#8b5e3c" }}>
              {fontSize}
            </Typography>
            <Typography sx={{ fontSize: `${fontSize}px`, lineHeight: 1, color: "#2f2721" }}>
              Aa
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        open={Boolean(headingAnchorEl)}
        anchorEl={headingAnchorEl}
        onClose={() => setHeadingAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 210, boxShadow: "0 12px 30px rgba(58, 46, 34, 0.18)" } }}
      >
        {headingOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              onApplyBlockFormat?.(option.value);
              setHeadingAnchorEl(null);
            }}
            sx={{ alignItems: "flex-end", py: 1, color: "#3b342d" }}
          >
            <Stack spacing={0.15}>
              <Typography sx={option.previewSx}>
                {option.label}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#7b6c5c" }}>
                {option.value.toUpperCase()}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      <Popover
        disableRestoreFocus
        disableEnforceFocus
        open={Boolean(linkAnchorEl)}
        anchorEl={linkAnchorEl}
        onClose={() => { setLinkAnchorEl(null); setLinkDraft(""); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: 2.2, p: 1.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 300 } }}
      >
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#3b342d" }}>Insert Link</Typography>
          <TextField
            size="small"
            placeholder="https://example.com"
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const url = normalizeUrl(linkDraft);
                if (!url) return;
                restoreSelectionRange();
                runCommand("createLink", url);
                setLinkDraft("");
                setLinkAnchorEl(null);
              }
            }}
          />
          <Stack direction="row" justifyContent="flex-end" spacing={0.8}>
            <Button size="small" onClick={() => { setLinkAnchorEl(null); setLinkDraft(""); }}>Cancel</Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                const url = normalizeUrl(linkDraft);
                if (!url) return;
                restoreSelectionRange();
                runCommand("createLink", url);
                setLinkDraft("");
                setLinkAnchorEl(null);
              }}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </Popover>

      <Popover
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        open={Boolean(imageAnchorEl)}
        anchorEl={imageAnchorEl}
        onClose={() => setImageAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: 2.2, p: 1.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 300 } }}
      >
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#3b342d" }}>Attach Image</Typography>
          <Typography sx={{ fontSize: 11.5, color: "#6a6054" }}>Select text first to bind image preview to that text. You can also drag and drop images directly into the editor.</Typography>
          <Stack direction="row" spacing={0.8}>
            <Button size="small" variant="outlined" onClick={() => { setImageMode("attach"); fileInputRef.current?.click(); }}>Attach To Selection</Button>
            <Button size="small" variant="contained" onClick={() => { setImageMode("insert"); fileInputRef.current?.click(); }}>Insert Token</Button>
          </Stack>
        </Stack>
      </Popover>

      <Menu
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        anchorEl={listMenuAnchorEl}
        open={Boolean(listMenuAnchorEl)}
        onClose={() => setListMenuAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 200, boxShadow: "0 12px 30px rgba(58, 46, 34, 0.18)" } }}
      >
        {[
          { label: "Bullet List", icon: <FormatListBulletedRoundedIcon sx={{ fontSize: 18 }} />, action: () => { restoreSelectionRange(); runCommand("insertUnorderedList"); } },
          { label: "Numbered List (1, 2, 3)", icon: <FormatListNumberedRoundedIcon sx={{ fontSize: 18 }} />, action: () => { restoreSelectionRange(); runCommand("insertOrderedList"); } },
          { label: "Roman (i, ii, iii)", icon: <FormatListNumberedRoundedIcon sx={{ fontSize: 18 }} />, listType: "lower-roman" },
          { label: "Roman (I, II, III)", icon: <FormatListNumberedRoundedIcon sx={{ fontSize: 18 }} />, listType: "upper-roman" },
          { label: "Alpha (a, b, c)", icon: <FormatListNumberedRoundedIcon sx={{ fontSize: 18 }} />, listType: "lower-alpha" },
          { label: "Alpha (A, B, C)", icon: <FormatListNumberedRoundedIcon sx={{ fontSize: 18 }} />, listType: "upper-alpha" },
        ].map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                restoreSelectionRange();
                runCommand("insertOrderedList");
                setTimeout(() => {
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    let node = sel.anchorNode;
                    while (node && node.nodeName !== "OL" && node !== editorRef.current) node = node.parentNode;
                    if (node && node.nodeName === "OL") {
                      node.style.listStyleType = item.listType;
                      node.setAttribute("data-list-type", item.listType);
                      syncEditorHtml();
                    }
                  }
                }, 0);
              }
              setListMenuAnchorEl(null);
            }}
            sx={{ fontSize: 13, color: "#3b342d", gap: 1 }}
          >
            <ListItemIcon sx={{ minWidth: "28px !important", color: "#6a6054" }}>{item.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Popover
        disableRestoreFocus
        disableEnforceFocus
        open={Boolean(noteAnchorEl)}
        anchorEl={noteAnchorEl}
        onClose={() => { setNoteAnchorEl(null); setNoteDraft(""); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: 2.2, p: 1.2, border: "1px solid #ddd0c0", bgcolor: "#f6eee3", minWidth: 300 } }}
      >
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#3b342d" }}>Attach Note</Typography>
          <Typography sx={{ fontSize: 11.5, color: "#6a6054" }}>Add a note annotation to the selected text. Hover to preview.</Typography>
          <TextField size="small" multiline minRows={2} maxRows={4} placeholder="Type your note here..." value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} autoFocus sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }} />
          <Stack direction="row" justifyContent="flex-end" spacing={0.8}>
            <Button size="small" onClick={() => { setNoteAnchorEl(null); setNoteDraft(""); }}>Cancel</Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (!noteDraft.trim()) return;
                restoreSelectionRange();
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                  setNoteAnchorEl(null);
                  setNoteDraft("");
                  return;
                }
                const range = sel.getRangeAt(0);
                const noteSpan = document.createElement("span");
                noteSpan.setAttribute("data-note-ref", buildId());
                noteSpan.setAttribute("data-note-text", noteDraft.trim());
                try {
                  range.surroundContents(noteSpan);
                } catch {
                  const frag = range.extractContents();
                  noteSpan.appendChild(frag);
                  range.insertNode(noteSpan);
                }
                sel.removeAllRanges();
                const afterRange = document.createRange();
                afterRange.setStartAfter(noteSpan);
                afterRange.collapse(true);
                sel.addRange(afterRange);
                syncEditorHtml();
                setNoteAnchorEl(null);
                setNoteDraft("");
              }}
            >
              Attach Note
            </Button>
          </Stack>
        </Stack>
      </Popover>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void attachImageToSelection(file);
          setImageAnchorEl(null);
        }}
      />

      <Box sx={{ position: "fixed", top: hoverPreview.y, left: hoverPreview.x, transform: hoverPreview.visible ? "translate(0, 0)" : "translate(0, 8px)", opacity: hoverPreview.visible ? 1 : 0, transition: "opacity 120ms ease, transform 120ms ease", pointerEvents: "none", zIndex: 1500 }}>
        <Paper elevation={8} sx={{ p: 0.8, borderRadius: 2.5, border: "1px solid #ddd0c0", bgcolor: "#fdf8f1", minWidth: 120, maxWidth: 260 }}>
          {hoverPreview.url ? <Box component="img" src={hoverPreview.url} alt={hoverPreview.label} sx={{ width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: 1.5, display: "block" }} /> : null}
          <Typography sx={{ mt: hoverPreview.url ? 0.6 : 0, fontSize: 12, color: "#5d5449", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{hoverPreview.label}</Typography>
        </Paper>
      </Box>
    </>
  );
}
