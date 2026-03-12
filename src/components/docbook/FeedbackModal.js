"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FeedbackRoundedIcon from "@mui/icons-material/FeedbackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

export default function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    /* In a real app, send to API. For now, simulate success. */
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
      setRating(5);
      onClose();
    }, 2500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          bgcolor: "#faf7f3",
          border: "1px solid #e7dfd5",
          boxShadow: "0 32px 80px rgba(58, 46, 34, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e7dfd5",
          background: "linear-gradient(135deg, #f0e6d8 0%, #f8f0e6 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
            }}
          >
            <FeedbackRoundedIcon sx={{ color: "#fff8f0", fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#2e261f" }}>
            Give Feedback
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6a6054" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {submitted ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <Typography sx={{ fontSize: 40 }}>🎉</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#2e261f" }}>
              Thank You!
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#8a7d70", textAlign: "center" }}>
              Your feedback helps us make DocBook better for everyone.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#4a3f36", mb: 1 }}>
                How would you rate your experience?
              </Typography>
              <Rating
                value={rating}
                onChange={(e, val) => setRating(val)}
                sx={{
                  color: "#8b5e3c",
                  "& .MuiRating-iconEmpty": { color: alpha("#8b5e3c", 0.2) },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#4a3f36", mb: 1 }}>
                Tell us more (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="What features would you like to see next? Any issues?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "#fff",
                    fontSize: 13,
                    "& fieldset": { borderColor: "#d9cab7" },
                    "&:hover fieldset": { borderColor: "#c4956a" },
                  },
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!rating}
              startIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 14,
                bgcolor: "#5c3d2e",
                "&:hover": { bgcolor: "#7a5240" },
                boxShadow: "0 4px 14px rgba(92, 61, 46, 0.2)",
              }}
            >
              Submit Feedback
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
