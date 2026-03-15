import { Box, Typography, Button, Paper, Backdrop, IconButton } from "@mui/material";
import { keyframes } from "@mui/system";
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(10px); }
  100% { transform: translateY(0px); }
`;

export default function WelcomeIntroModal({ open, onClose }) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 1400,
        bgcolor: "rgba(255, 251, 246, 0.68)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
          width: '100%'
        }}
      >
        {/* Heading */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 600,
            letterSpacing: "-1px",
            mb: 1
          }}
        >
          Your space to build ideas faster
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            mb: 6
          }}
        >
          From quick thoughts to organized notes
        </Typography>

        {/* Ticket Card */}
        <Paper
          elevation={0}
          sx={{
            width: 420,
            borderRadius: 4,
            p: 4,
            transition: "transform 0.3s ease",
            "&:hover": {
              transform: "translateY(-6px)"
            },
            bgcolor: 'transparent'
          }}
        >
          <Box
            component="img"
            src="/favicon.png"
            sx={{
              width: 150,
              mb: 2
            }}
          />

          <Typography variant="h4" fontWeight={600}>
            DocBook
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
              mb: 3
            }}
          >
            Capture ideas and organize your thoughts
          </Typography>
        </Paper>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: 116,
            borderRadius: 999,
            px: 4,
            py: 1,
            textTransform: "none",
            fontWeight: 700,
            bgcolor: "#2f2418",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#241b12",
              boxShadow: "none",
            },
          }}
          endIcon={
            <KeyboardArrowDownRoundedIcon sx={{ color: "#fff" }} />
          }
        >
          Try now
        </Button>
      </Box>
    </Backdrop>

  );
}
