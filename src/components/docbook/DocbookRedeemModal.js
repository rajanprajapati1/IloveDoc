import React, { useState } from 'react';
import { Box, Modal, Paper, Typography, TextField, Button, IconButton, CircularProgress } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { alpha } from '@mui/material/styles';

export default function DocbookRedeemModal({ open, onClose, accentColor = "#1976d2" }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/v1/doc/ai/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem code.");
      }

      setSuccess(true);
      setTimeout(() => {
        setCode("");
        setSuccess(false);
        onClose(true); // pass true to indicate successful redemption
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          m: 2,
          p: 3,
          borderRadius: 4,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <IconButton
            onClick={() => !loading && onClose(false)}
            sx={{ 
                position: 'absolute', 
                top: 12, 
                right: 12,
                color: "#999",
                width: 32,
                height: 32
            }}
        >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${alpha(accentColor, 0.6)} 0%, ${alpha(accentColor, 0.2)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EmojiEventsRoundedIcon sx={{ fontSize: 22, color: accentColor }} />
            </Box>
            <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                    Redeem Code
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                    Get more daily AI tokens to keep writing.
                </Typography>
            </Box>
        </Box>

        {success ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#2e7d32', mb: 1 }}>
                    Code applied successfully!
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#555' }}>
                    You can now continue using AI.
                </Typography>
            </Box>
        ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    autoFocus
                    fullWidth
                    placeholder="Enter code... (e.g. BOOST10)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: 'rgba(0,0,0,0.03)',
                            '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                            '&:hover fieldset': { borderColor: alpha(accentColor, 0.3) },
                            '&.Mui-focused fieldset': { borderColor: accentColor },
                        },
                        '& input': {
                            fontSize: 16,
                            py: 1.5,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textAlign: 'center'
                        }
                    }}
                />

                {error && (
                    <Typography sx={{ color: '#d32f2f', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                        {error}
                    </Typography>
                )}

                <Button
                    type="submit"
                    disabled={!code.trim() || loading}
                    fullWidth
                    variant="contained"
                    sx={{
                        bgcolor: accentColor,
                        color: '#fff',
                        py: 1.2,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: 15,
                        fontWeight: 700,
                        boxShadow: `0 4px 14px ${alpha(accentColor, 0.4)}`,
                        '&:hover': {
                            bgcolor: alpha(accentColor, 0.9),
                            boxShadow: `0 6px 20px ${alpha(accentColor, 0.5)}`,
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Redeem"}
                </Button>
            </Box>
        )}
      </Paper>
    </Modal>
  );
}
