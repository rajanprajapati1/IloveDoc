import React, { useState } from 'react';
import {
 Box,
 Typography,
 List,
 ListItem,
 ListItemButton,
 ListItemIcon,
 ListItemText,
 Avatar,
 Divider,
 Button,
 Switch,
 Select,
 MenuItem,
 TextField,
 IconButton,
 Badge,
 ThemeProvider,
 createTheme,
 CssBaseline,
 Slider,
 ToggleButton,
 ToggleButtonGroup,
 Stack,
 Tooltip,
 alpha,
} from '@mui/material';

// --- Icons ---
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import WebOutlinedIcon from '@mui/icons-material/WebOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SupportOutlinedIcon from '@mui/icons-material/SupportOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
// --- Custom Theme ---
const theme = createTheme({
 typography: {
  fontFamily: 'var(--font-manrope), "Segoe UI", sans-serif',
  button: { textTransform: 'none', fontWeight: 500 },
 },
 palette: {
  background: { default: '#fff', paper: '#FFFFFF' },
  primary: { main: '#2C68F6' },
  text: { primary: '#1A1D23', secondary: '#6B7280' },
 },
 components: {
  MuiButton: {
   styleOverrides: {
    root: { borderRadius: 24, padding: '6px 16px' },
   },
  },
  MuiSwitch: {
   styleOverrides: {
    root: { padding: 8 },
    thumb: { width: 16, height: 16, margin: 2 },
   },
  },
  MuiToggleButton: {
   styleOverrides: {
    root: { borderRadius: 20, margin: '0 4px', border: '1px solid #E5E7EB !important' },
   },
  },
 },
});

// --- Dummy Data ---
const PRESET_COLORS = ['#1A1D23', '#6366F1', '#3B82F6', '#0EA5E9', '#10B981'];
const STICKY_NOTE_COLORS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#E9D5FF'];
const FONT_FAMILIES = [
 { label: 'Inter (default)', value: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
 { label: 'Roboto', value: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif' },
 { label: 'System UI', value: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' },
 { label: 'SF Pro / Apple', value: '"SF Pro Display", "SF Pro Text", -apple-system, system-ui, "Inter", "Roboto", sans-serif' },
];
const NOTE_THEMES = [
 { label: 'Modern', value: 'modern' },
 { label: 'Classic', value: 'classic' },
 { label: 'Minimal', value: 'minimal' },
];

const BUTTON_STYLES = [
 { label: 'Solid', value: 'contained' },
 { label: 'Outlined', value: 'outlined' },
 { label: 'Ghost', value: 'text' },
];

const NAV_STYLES = [
 { label: 'Full Sidebar', value: 'full' },
 { label: 'Compact', value: 'compact' },
];

export default function AppearanceDashboard() {
 // --- State Management ---
 const [activeTheme, setActiveTheme] = useState('system'); // 'system', 'light', 'dark'
 const [activeTableView, setActiveTableView] = useState('default'); // 'default', 'compact'
 const [brandColor, setBrandColor] = useState('#2C68F6');
 const [defaultAccentColor, setDefaultAccentColor] = useState('#6366F1');
 const [transparentSidebar, setTransparentSidebar] = useState(true);
 const [sidebarFeature, setSidebarFeature] = useState('recent');

 // Extra options added per request
 const [fontScale, setFontScale] = useState('medium');
 const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
 const [enableAnimations, setEnableAnimations] = useState(true);
 const [stickyNoteColor, setStickyNoteColor] = useState(STICKY_NOTE_COLORS[0]);
 const [defaultNoteTheme, setDefaultNoteTheme] = useState('modern');

 // New customization options
 const [borderRadius, setBorderRadius] = useState(8);
 const [shadowIntensity, setShadowIntensity] = useState(2);
 const [navStyle, setNavStyle] = useState('full');
 const [glassmorphism, setGlassmorphism] = useState(false);
 const [glassIntensity, setGlassIntensity] = useState(4);
 const [buttonStyle, setButtonStyle] = useState('contained');

 const [headerHeight, setHeaderHeight] = useState(64);
 const [sidebarWidth, setSidebarWidth] = useState(260);
 const [iconStyle, setIconStyle] = useState('rounded');
 const [inputDensity, setInputDensity] = useState('standard');
 const [layoutWidth, setLayoutWidth] = useState('fluid');

 // Cloud Sync State
 const [pin, setPin] = useState(['', '', '', '']);
 const [isSyncVerified, setIsSyncVerified] = useState(false);
 const [isSyncing, setIsSyncing] = useState(false);

 const handleSyncSubmit = () => {
  setIsSyncing(true);
  setTimeout(() => setIsSyncing(false), 3000); // Simulated sync duration
 };

 // --- Components ---

 const SettingRow = ({ title, description, children, noDivider }) => (
  <Box>
   <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 2 }}>
    <Box sx={{ flex: '0 0 240px' }}>
     <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.2, color: '#1A1D23' }}>
      {title}
     </Typography>
     <Typography variant="caption" sx={{ color: '#6B7280', pr: 2, display: 'block' }}>
      {description}
     </Typography>
    </Box>
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
     {children}
    </Box>
   </Box>
   {!noDivider && <Divider sx={{ borderColor: '#F3F4F6' }} />}
  </Box>
 );

 const VisualCard = ({ type, title, isSelected, onClick }) => {
  // Generates the mini-UI visual representations for themes/tables
  return (
   <Box sx={{ textAlign: 'left', mr: 2, cursor: 'pointer' }} onClick={onClick}>
    <Box
     sx={{
      width: 160,
      height: 100,
      border: `2px solid ${isSelected ? theme.palette.primary.main : '#E5E7EB'}`,
      borderRadius: 3,
      mb: 1,
      position: 'relative',
      overflow: 'hidden',
      bgcolor: type === 'dark' ? '#1E1E1E' : '#FFFFFF',
      display: 'flex',
     }}
    >
     {/* Card Visual Mockup Content */}
     <Box sx={{ width: '30%', borderRight: '1px solid', borderColor: type === 'dark' ? '#333' : '#E5E7EB', p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: type === 'dark' ? '#555' : '#D1D5DB' }} />
      <Box sx={{ width: '80%', height: 4, borderRadius: 1, bgcolor: type === 'dark' ? '#555' : '#E5E7EB', mt: 1 }} />
      <Box sx={{ width: '60%', height: 4, borderRadius: 1, bgcolor: type === 'dark' ? '#555' : '#E5E7EB' }} />
     </Box>
     <Box sx={{ flex: 1, p: 1, bgcolor: type === 'dark' ? '#2D2D2D' : (type === 'system' ? '#F4F5F7' : '#FFFFFF') }}>
      <Box sx={{ width: '40%', height: 6, borderRadius: 1, bgcolor: type === 'dark' ? '#555' : '#D1D5DB', mb: 1 }} />
      <Box sx={{ width: '100%', height: 40, borderRadius: 1, bgcolor: type === 'dark' ? '#444' : '#E5E7EB' }} />
     </Box>

     {isSelected && (
      <CheckCircleIcon sx={{ position: 'absolute', bottom: 8, left: 8, color: theme.palette.primary.main, fontSize: 20, bgcolor: '#fff', borderRadius: '50%' }} />
     )}
    </Box>
    <Typography variant="caption" sx={{ fontWeight: 500, color: '#4B5563' }}>
     {title}
    </Typography>
   </Box>
  );
 };

 // Removed PreviewSection per user request
 const accentColor = "#F7E36D"
 return (
  <ThemeProvider theme={theme}>
   <CssBaseline />
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
      border: `1px solid ${alpha(accentColor, 0.16)}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 40px ${alpha("#7b5f39", 0.08)}`,
     }}
    >
     <Box
      sx={{
       height: "100%",
       overflowY: "auto",
       px: 2,
       "&::-webkit-scrollbar": { width: 6 },
       "&::-webkit-scrollbar-thumb": { background: alpha("#8f7d66", 0.22), borderRadius: 999 },
      }}
     >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, px: 3 }}>
       <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>Appearance</Typography>
       <IconButton size="small"><MoreVertIcon sx={{ fontSize: 20 }} /></IconButton>
      </Box>
      <Divider sx={{ borderColor: '#F3F4F6' }} />

      {/* Scrollable Settings Content */}
      <Box sx={{ p: 2, pt: 1, pb: 12, overflowY: 'auto', flex: 1 }}>

       {/* Cloud Synchronization - REDESIGNED PER USER REQUEST FOR PROMINENT BIG BOX */}
       <Box sx={{
        bgcolor: '#F9FAFB',
        borderRadius: 5,
        p: 4,
        mb: 4,
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 260,
        justifyContent: 'center'
       }}>
        {!isSyncVerified ? (
         <Box sx={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: -1 }}>Cloud Sync Initialization</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>Securely connect your appearance settings to the cloud using a private 4-digit PIN.</Typography>

          <Stack direction="row" spacing={2} sx={{ my: 1 }}>
           {[0, 1, 2, 3].map((i) => (
            <TextField
             key={i}
             id={`pin-${i}`}
             variant="outlined"
             type="password"
             autoComplete="off"
             value={pin[i]}
             onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length > 1) return;
              const newPin = [...pin];
              newPin[i] = val;
              setPin(newPin);
              if (val && i < 3) {
               document.getElementById(`pin-${i + 1}`).focus();
              }
             }}
             onKeyDown={(e) => {
              if (e.key === 'Backspace' && !pin[i] && i > 0) {
               document.getElementById(`pin-${i - 1}`).focus();
              }
             }}
             inputProps={{
              maxLength: 1,
              style: { textAlign: 'center', p: 0, width: 48, height: 48, fontSize: 44, fontWeight: 900 }
             }}
             sx={{ '& .MuiInputBase-root': { borderRadius: 3, bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } }}
            />
           ))}
          </Stack>

          <Button
           variant="contained"
           size="large"
           disabled={pin.some(p => !p)}
           onClick={() => setIsSyncVerified(true)}
           sx={{ borderRadius: 10, px: 6, py: 1.2, fontSize: 15, fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
          >
           Start Synchronization
          </Button>
         </Box>
        ) : (
         <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
           <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>You're ready to start sync</Typography>
           <Typography variant="body2" sx={{ color: 'text.secondary' }}>All appearance changes in your folders will be synced automatically.</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative', width: 'fit-content' }}>
           {/* LOCAL CARD */}
           <Box sx={{
            bgcolor: '#fff',
            p: 3,
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            textAlign: 'left',
            zIndex: 2
           }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
             <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5', letterSpacing: 1, textTransform: 'uppercase' }}>Local</Typography>
             <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 800, mb: 0.5 }}>Computer</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>C:\JoinAD\Layouts</Typography>
           </Box>

           {/* SYNC ICON */}
           <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: isSyncing ? '#10B981' : '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSyncing ? '0 0 0 8px rgba(16, 185, 129, 0.2)' : '0 0 0 8px rgba(79, 70, 229, 0.1)',
            zIndex: 3,
            transition: 'all 0.5s ease'
           }}>
            <SyncOutlinedIcon sx={{
             color: '#fff',
             fontSize: 24,
             animation: isSyncing ? 'spin 1.5s linear infinite' : 'spin 10s linear infinite'
            }} />
           </Box>

           {/* CLOUD CARD */}
           <Box sx={{
            bgcolor: '#fff',
            p: 3,
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            textAlign: 'left',
            zIndex: 2
           }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
             <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', letterSpacing: 1, textTransform: 'uppercase' }}>Cloud</Typography>
             <VerifiedUserOutlinedIcon sx={{ fontSize: 16, color: '#10B981' }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 800, mb: 0.5 }}>BeeDrive</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>D:\Datasheet\Sync</Typography>
           </Box>

           {/* Visual Link Line */}
           <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            right: '10%',
            height: 2,
            bgcolor: isSyncing ? '#10B981' : '#EEF2FF',
            zIndex: 1,
            backgroundImage: isSyncing
             ? 'linear-gradient(to right, #10B981 50%, transparent 50%)'
             : 'linear-gradient(to right, #EEF2FF 50%, transparent 50%)',
            backgroundSize: '12px 2px',
            animation: isSyncing ? 'pulseLink 2s linear infinite' : 'none',
            opacity: isSyncing ? 1 : 0.5,
            transition: 'all 0.5s ease',
            '@keyframes pulseLink': {
             '0%': { backgroundPosition: '0 0' },
             '100%': { backgroundPosition: '24px 0' }
            }
           }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <Button
            variant="outlined"
            onClick={() => {
             setIsSyncVerified(false);
             setPin(['', '', '', '']);
            }}
            sx={{ borderRadius: 10, px: 3, py: 1, color: '#374151', borderColor: '#D1D5DB', fontSize: 13, fontWeight: 600 }}
           >
            Modify Connection
           </Button>
           <Button
            variant="contained"
            onClick={handleSyncSubmit}
            disabled={isSyncing}
            sx={{
             borderRadius: 10, px: 5, py: 1,
             bgcolor: isSyncing ? '#10B981' : '#4F46E5',
             boxShadow: isSyncing ? '0 4px 14px 0 rgba(16, 185, 129, 0.3)' : '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
             '&:hover': { bgcolor: isSyncing ? '#059669' : '#4338CA' },
             fontSize: 13, fontWeight: 700,
             minWidth: 140
            }}
            startIcon={isSyncing ? <VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} /> : <SyncOutlinedIcon sx={{ fontSize: 18 }} />}
           >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
           </Button>

           <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />

           <Stack direction="row" spacing={1}>
            <Tooltip title="Export Configuration">
             <IconButton sx={{ border: '1px solid #E5E7EB', borderRadius: 3, p: 1, '&:hover': { bgcolor: '#F9FAFB' } }}>
              <CloudUploadOutlinedIcon sx={{ fontSize: 20, color: '#4B5563' }} />
             </IconButton>
            </Tooltip>
            <Tooltip title="Import Configuration">
             <IconButton sx={{ border: '1px solid #E5E7EB', borderRadius: 3, p: 1, '&:hover': { bgcolor: '#F9FAFB' } }}>
              <CloudDownloadOutlinedIcon sx={{ fontSize: 20, color: '#4B5563' }} />
             </IconButton>
            </Tooltip>
           </Stack>
          </Box>
         </Box>
        )}
       </Box>

       <Divider sx={{ mb: 1, borderColor: '#F3F4F6' }} />

       {/* Brand Color */}
       <SettingRow title="Brand color" description="Select or customize your brand color.">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
         <Box sx={{ display: 'flex', gap: 1.5 }}>
          {PRESET_COLORS.map((color) => (
           <Box
            key={color}
            onClick={() => setBrandColor(color)}
            sx={{
             width: 24, height: 24, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
             boxShadow: brandColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none'
            }}
           />
          ))}
         </Box>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">Custom color:</Typography>
          <TextField
           size="small"
           value={brandColor}
           onChange={(e) => setBrandColor(e.target.value)}
           sx={{ width: 100, '& .MuiInputBase-root': { height: 32, fontSize: 13, borderRadius: 5 } }}
          />
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: brandColor, border: '2px solid #2C68F6', p: '2px', backgroundClip: 'content-box' }} />
         </Box>
        </Box>
       </SettingRow>

       {/* Interface Theme */}
       <SettingRow title="Interface theme" description="Select or customize your UI theme.">
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
         <VisualCard type="system" title="System preference" isSelected={activeTheme === 'system'} onClick={() => setActiveTheme('system')} />
         <VisualCard type="light" title="Light" isSelected={activeTheme === 'light'} onClick={() => setActiveTheme('light')} />
         <VisualCard type="dark" title="Dark" isSelected={activeTheme === 'dark'} onClick={() => setActiveTheme('dark')} />
        </Box>
       </SettingRow>

       {/* Transparent Sidebar */}
       <SettingRow title="Transparent sidebar" description="Make the desktop sidebar transparent.">
        <Switch checked={transparentSidebar} onChange={(e) => setTransparentSidebar(e.target.checked)} color="primary" />
       </SettingRow>


       {/* Tables View */}
       <SettingRow title="Tables view" description="How are tables displayed in the app.">
        <Box sx={{ display: 'flex', gap: 2 }}>
         <VisualCard type="light" title="Default" isSelected={activeTableView === 'default'} onClick={() => setActiveTableView('default')} />
         <VisualCard type="light" title="Compact" isSelected={activeTableView === 'compact'} onClick={() => setActiveTableView('compact')} />
        </Box>
       </SettingRow>

       {/* EXTRA OPTION 1: Typography Scale */}
       <SettingRow title="Typography scale" description="Adjust the base font size of the application.">
        <Select
         size="small"
         value={fontScale}
         onChange={(e) => setFontScale(e.target.value)}
         sx={{ width: 200, fontSize: 14 }}
        >
         <MenuItem value="small">Small (12px)</MenuItem>
         <MenuItem value="medium">Medium (14px)</MenuItem>
         <MenuItem value="large">Large (16px)</MenuItem>
        </Select>
       </SettingRow>

       <SettingRow title="Typography" description="Choose the primary font used across the app.">
        <Select
         size="small"
         value={fontFamily}
         onChange={(e) => setFontFamily(e.target.value)}
         sx={{ width: 320, fontSize: 14 }}
        >
         {FONT_FAMILIES.map((f) => (
          <MenuItem key={f.value} value={f.value}>
           {f.label}
          </MenuItem>
         ))}
        </Select>
       </SettingRow>

       <SettingRow title="Sticky note color" description="Set the default color for newly created sticky notes.">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
         <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {STICKY_NOTE_COLORS.map((color) => (
           <Box
            key={color}
            onClick={() => setStickyNoteColor(color)}
            sx={{
             width: 24,
             height: 24,
             borderRadius: '50%',
             bgcolor: color,
             cursor: 'pointer',
             border: '1px solid #E5E7EB',
             boxShadow: stickyNoteColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${theme.palette.primary.main}` : 'none',
            }}
           />
          ))}
         </Box>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">Custom color:</Typography>
          <TextField
           size="small"
           value={stickyNoteColor}
           onChange={(e) => setStickyNoteColor(e.target.value)}
           sx={{ width: 140, '& .MuiInputBase-root': { height: 36, fontSize: 14 } }}
          />
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: stickyNoteColor, border: '2px solid #E5E7EB', p: '2px', backgroundClip: 'content-box' }} />
         </Box>
        </Box>
       </SettingRow>

       <SettingRow title="Default note theme" description="Pick the base styling for notes (padding, radius, and shadows).">
        <Select
         size="small"
         value={defaultNoteTheme}
         onChange={(e) => setDefaultNoteTheme(e.target.value)}
         sx={{ width: 240, fontSize: 14 }}
        >
         {NOTE_THEMES.map((t) => (
          <MenuItem key={t.value} value={t.value}>
           {t.label}
          </MenuItem>
         ))}
        </Select>
       </SettingRow>

       <SettingRow title="Default accent color" description="Used for highlights, badges, and secondary emphasis.">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
         <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((color) => (
           <Box
            key={color}
            onClick={() => setDefaultAccentColor(color)}
            sx={{
             width: 24,
             height: 24,
             borderRadius: '50%',
             bgcolor: color,
             cursor: 'pointer',
             boxShadow: defaultAccentColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
            }}
           />
          ))}
         </Box>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">Custom color:</Typography>
          <TextField
           size="small"
           value={defaultAccentColor}
           onChange={(e) => setDefaultAccentColor(e.target.value)}
           sx={{ width: 120, '& .MuiInputBase-root': { height: 36, fontSize: 14 } }}
          />
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: defaultAccentColor, border: '2px solid #2C68F6', p: '2px', backgroundClip: 'content-box' }} />
         </Box>
        </Box>
       </SettingRow>

       {/* EXTRA OPTION 2: UI Animations */}
       <SettingRow title="UI Animations" description="Enable or disable motion and transition effects.">
        <Switch checked={enableAnimations} onChange={(e) => setEnableAnimations(e.target.checked)} color="primary" />
       </SettingRow>

       <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />
       <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, px: 0 }}>Advanced Customization</Typography>

       {/* Border Radius */}
       <SettingRow title="Border Radius" description="Control the roundness of corners across the application.">
        <Box sx={{ width: 320, px: 1 }}>
         <Slider
          value={borderRadius}
          min={0}
          max={24}
          step={2}
          marks
          valueLabelDisplay="auto"
          onChange={(e, newValue) => setBorderRadius(newValue)}
         />
        </Box>
       </SettingRow>

       {/* Shadow Intensity */}
       <SettingRow title="Shadow Intensity" description="Adjust the depth of component shadows.">
        <Box sx={{ width: 320, px: 1 }}>
         <Slider
          value={shadowIntensity}
          min={0}
          max={12}
          step={1}
          marks
          valueLabelDisplay="auto"
          onChange={(e, newValue) => setShadowIntensity(newValue)}
         />
        </Box>
       </SettingRow>

       {/* Header Height */}
       <SettingRow title="Header Height" description="Adjust the height of the top navigation bar.">
        <Box sx={{ width: 320, px: 1 }}>
         <Slider
          value={headerHeight}
          min={48}
          max={96}
          step={4}
          marks
          valueLabelDisplay="auto"
          onChange={(e, newValue) => setHeaderHeight(newValue)}
         />
        </Box>
       </SettingRow>

       {/* Sidebar Width */}
       <SettingRow title="Sidebar Width" description="Control the expanded width of the desktop sidebar.">
        <Box sx={{ width: 320, px: 1 }}>
         <Slider
          value={sidebarWidth}
          min={200}
          max={320}
          step={10}
          marks
          valueLabelDisplay="auto"
          onChange={(e, newValue) => setSidebarWidth(newValue)}
         />
        </Box>
       </SettingRow>

       {/* Button Style */}
       <SettingRow title="Button Style" description="Choose the default visual style for buttons.">
        <ToggleButtonGroup
         value={buttonStyle}
         exclusive
         onChange={(e, v) => v && setButtonStyle(v)}
         size="small"
         sx={{ bgcolor: '#F3F4F6', p: 0.5, borderRadius: 10, '& .MuiToggleButton-root': { border: 'none', px: 2, borderRadius: 10, '&.Mui-selected': { bgcolor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { bgcolor: '#fff' } } } }}
        >
         {BUTTON_STYLES.map(s => <ToggleButton key={s.value} value={s.value} sx={{ px: 2 }}>{s.label}</ToggleButton>)}
        </ToggleButtonGroup>
       </SettingRow>

       {/* Icon Style */}
       <SettingRow title="Icon Style" description="Select the visual appearance of interface icons.">
        <ToggleButtonGroup
         value={iconStyle}
         exclusive
         onChange={(e, v) => v && setIconStyle(v)}
         size="small"
         sx={{ bgcolor: '#F3F4F6', p: 0.5, borderRadius: 10, '& .MuiToggleButton-root': { border: 'none', px: 2, borderRadius: 10, '&.Mui-selected': { bgcolor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { bgcolor: '#fff' } } } }}
        >
         <ToggleButton value="rounded" sx={{ px: 2 }}>Rounded</ToggleButton>
         <ToggleButton value="sharp" sx={{ px: 2 }}>Sharp</ToggleButton>
         <ToggleButton value="outlined" sx={{ px: 2 }}>Outlined</ToggleButton>
        </ToggleButtonGroup>
       </SettingRow>

       {/* Input Density */}
       <SettingRow title="Input Density" description="Change the vertical spacing of form fields and inputs.">
        <ToggleButtonGroup
         value={inputDensity}
         exclusive
         onChange={(e, v) => v && setInputDensity(v)}
         size="small"
         sx={{ bgcolor: '#F3F4F6', p: 0.5, borderRadius: 10, '& .MuiToggleButton-root': { border: 'none', px: 2, borderRadius: 10, '&.Mui-selected': { bgcolor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { bgcolor: '#fff' } } } }}
        >
         <ToggleButton value="standard" sx={{ px: 2 }}>Standard</ToggleButton>
         <ToggleButton value="dense" sx={{ px: 2 }}>Dense</ToggleButton>
        </ToggleButtonGroup>
       </SettingRow>

       {/* Navigation Style */}
       <SettingRow title="Navigation Style" description="Change the layout of the primary navigation.">
        <Select
         size="small"
         value={navStyle}
         onChange={(e) => setNavStyle(e.target.value)}
         sx={{ width: 200, fontSize: 14 }}
        >
         {NAV_STYLES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </Select>
       </SettingRow>

       {/* Page Layout */}
       <SettingRow title="Page Layout" description="Control the maximum width of the main content area.">
        <Select
         size="small"
         value={layoutWidth}
         onChange={(e) => setLayoutWidth(e.target.value)}
         sx={{ width: 200, fontSize: 14 }}
        >
         <MenuItem value="fluid">Fluid / Full Width</MenuItem>
         <MenuItem value="centered">Centered / Boxed</MenuItem>
        </Select>
       </SettingRow>

       {/* Glassmorphism */}
       <SettingRow title="Glassmorphism" description="Add translucent blur effects to the sidebar.">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Switch checked={glassmorphism} onChange={(e) => setGlassmorphism(e.target.checked)} color="primary" />
          <Typography variant="body2">{glassmorphism ? 'Enabled' : 'Disabled'}</Typography>
         </Box>
         {glassmorphism && (
          <Box sx={{ width: 320, px: 1 }}>
           <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Blur Intensity: {glassIntensity}px</Typography>
           <Slider
            value={glassIntensity}
            min={0}
            max={20}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(e, newValue) => setGlassIntensity(newValue)}
           />
          </Box>
         )}
        </Box>
       </SettingRow>

      </Box>

      {/* Bottom Action Buttons */}
      <Box sx={{
       p: 1.5,
       display: 'flex',
       justifyContent: 'flex-end',
       position: 'absolute',
       bottom: 20,
       right: 20,
       zIndex: 100
      }}>
       <Box sx={{
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        p: 0.8,
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        gap: 1,
        border: '1px solid rgba(229, 231, 235, 0.5)'
       }}>
        <Button size="small" variant="outlined" sx={{ color: '#374151', borderColor: '#D1D5DB', bgcolor: 'rgba(255,255,255,0.5)', fontSize: 12, borderRadius: 10, px: 3 }}>Cancel</Button>
        <Button size="small" variant="contained" color="primary" sx={{ boxShadow: 'none', fontSize: 12, borderRadius: 10, px: 3 }}>Save changes</Button>
       </Box>
      </Box>

     </Box>

    </Box>
   </Box>
  </ThemeProvider>
 );
}
