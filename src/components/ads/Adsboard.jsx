import React from 'react';
import {
 Box, Grid, Paper, Typography, Avatar, Chip, Button,
 List, ListItem, Divider, LinearProgress, IconButton
} from '@mui/material';
import { Notifications, Add, MoreVert, Link as LinkIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
 typography: { fontFamily: 'Inter, sans-serif' },
 shape: { borderRadius: 20 }
});

const CustomCard = ({ children, sx }) => (
 <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid #f0f0f0', ...sx }}>
  {children}
 </Paper>
);

export default function Dashboard() {
 return (
  <ThemeProvider theme={theme}>
   <Box sx={{ bgcolor: '#f5f4f2', minHeight: '100vh', p: 4 }}>
    <Grid container spacing={3}>
     {/* LEFT COLUMN */}
     <Grid item xs={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
       <Avatar src="path-to-image.jpg" sx={{ mr: 2 }} />
       <Box>
        <Typography variant="subtitle1" fontWeight="bold">Paityn Levin</Typography>
        <Typography variant="caption" color="textSecondary">SR. UI DESIGNER</Typography>
       </Box>
      </Box>

      <CustomCard sx={{ mb: 2 }}>
       <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography fontWeight="bold">To do list</Typography>
        <Add fontSize="small" />
       </Box>
       {['Update button styles', 'Sync with UX team', 'Create wireframes'].map((text, i) => (
        <Box key={i} mb={2}>
         <Typography variant="body2">{text}</Typography>
         <Chip label={i === 0 ? "Blocking" : "Essential"} size="small" sx={{ mt: 0.5, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
        </Box>
       ))}
      </CustomCard>

      <CustomCard>
       <Typography fontWeight="bold" mb={2}>Notifications</Typography>
       <Box display="flex" alignItems="center">
        <Avatar sx={{ mr: 1, width: 30, height: 30 }} />
        <Typography variant="body2">Charlie Herwitz: Please review the file...</Typography>
       </Box>
      </CustomCard>
     </Grid>

     {/* CENTER COLUMN */}
     <Grid item xs={6}>
      <CustomCard sx={{ height: 400, position: 'relative', overflow: 'hidden' }}>
       <Box sx={{ height: '80%', bgcolor: '#d9d9d9', borderRadius: 4, mb: 2 }} />
       <Typography variant="h6">Meeting with Gilbert</Typography>
       <Typography variant="caption">Design system updates & development</Typography>
      </CustomCard>

      <CustomCard sx={{ mt: 3, bgcolor: '#1b4d3e', color: 'white' }}>
       <Typography variant="h6" mb={2}>Project overview</Typography>
       <LinearProgress variant="determinate" value={60} sx={{ height: 10, borderRadius: 5, bgcolor: '#12362b' }} />
      </CustomCard>
     </Grid>

     {/* RIGHT COLUMN */}
     <Grid item xs={3}>
      <CustomCard sx={{ bgcolor: '#1a1a1a', color: 'white', mb: 3 }}>
       <Typography variant="subtitle2">✨ AI suggestions</Typography>
       <Typography variant="caption">Would you like to set this task to High Priority?</Typography>
      </CustomCard>

      <CustomCard sx={{ mb: 3 }}>
       <Typography fontWeight="bold">Scheduling</Typography>
       <Typography variant="h4" fontWeight="bold">Mar 28</Typography>
       <Box sx={{ height: 120, bgcolor: '#e0f7fa', mt: 2, borderRadius: 4 }} />
      </CustomCard>

      <CustomCard>
       <Box display="flex" justifyContent="space-between">
        <Typography fontWeight="bold">File & media library</Typography>
        <Add />
       </Box>
       <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h5">362 files</Typography>
        <Button variant="contained" sx={{ mt: 2, borderRadius: 10, bgcolor: '#1b4d3e' }}>Open the folder</Button>
       </Box>
      </CustomCard>
     </Grid>
    </Grid>
   </Box>
  </ThemeProvider>
 );
}