"use client";

import { Box, Button, Dialog, DialogContent, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

const TIERS = [
  {
    name: "Standard",
    price: "Free",
    storage: "10 MB",
    icon: <ShieldRoundedIcon sx={{ fontSize: 24 }} />,
    color: "#8a7d70",
    bg: alpha("#8a7d70", 0.05),
    features: ["Local IndexedDB storage", "Manual cloud push", "Unlimited local notes", "Standard support"],
  },
  {
    name: "Premium",
    price: "₹100",
    period: "/mo",
    storage: "1 GB",
    popular: true,
    icon: <RocketLaunchRoundedIcon sx={{ fontSize: 24 }} />,
    color: "#8b5e3c",
    bg: "linear-gradient(135deg, #fff7ef 0%, #fef3e5 100%)",
    features: ["5GB cloud storage", "Auto-sync every 1 min", "Priority cloud sync", "Email support"],
  },
  {
    name: "Enterprise",
    price: "₹500",
    period: "/mo",
    storage: "Unlimited",
    icon: <DiamondRoundedIcon sx={{ fontSize: 24 }} />,
    color: "#5c3d2e",
    bg: "linear-gradient(135deg, #f5efe7 0%, #ede3d5 100%)",
    features: ["Unlimited cloud storage", "Real-time sync", "Advanced analytics", "24/7 VIP support"],
  },
];

export default function PricingPanel({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 6,
          bgcolor: "#faf7f3",
          border: "1px solid #e7dfd5",
          boxShadow: "0 40px 100px rgba(58, 46, 34, 0.3)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 3, md: 5 },
          pt: 5,
          pb: 4,
          textAlign: "center",
          background: "linear-gradient(180deg, #f0e6d8 0%, #faf7f3 100%)",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#8b5e3c", letterSpacing: "0.15em", mb: 1.5, textTransform: "uppercase" }}>
          Go Beyond Local
        </Typography>
        <Typography sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 900, color: "#2e261f", lineHeight: 1.1, mb: 2 }}>
          Choose your cloud power.
        </Typography>
        <Typography sx={{ fontSize: 16, color: "#6a6054", maxWidth: 500, mx: "auto", fontWeight: 500 }}>
          Sync your thoughts across devices with zero friction. Choose a plan that fits your growth.
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 16, right: 16, color: "#6a6054" }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch">
          {TIERS.map((tier) => (
            <Paper
              key={tier.name}
              elevation={0}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 5,
                border: "2px solid",
                borderColor: tier.popular ? "#c4956a" : alpha("#d9cab7", 0.6),
                background: tier.bg,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 200ms ease, box-shadow 200ms ease",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 20px 40px rgba(92, 61, 46, 0.15)",
                },
              }}
            >
              {tier.popular && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    bgcolor: "#c4956a",
                    color: "#fff",
                    px: 1.5,
                    py: 0.4,
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    boxShadow: "0 4px 10px rgba(196, 149, 106, 0.4)",
                  }}
                >
                  Most Popular
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: alpha(tier.color, 0.1),
                    color: tier.color,
                    display: "grid",
                    placeItems: "center",
                    mb: 2,
                  }}
                >
                  {tier.icon}
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#2e261f" }}>
                  {tier.name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#8a7d70", fontWeight: 600 }}>
                  Storage Limit: {tier.storage}
                </Typography>
              </Box>

              <Box sx={{ mb: 4, display: "flex", alignItems: "baseline" }}>
                <Typography sx={{ fontSize: 32, fontWeight: 900, color: tier.color }}>
                  {tier.price}
                </Typography>
                {tier.period && (
                  <Typography sx={{ fontSize: 14, color: "#8a7d70", fontWeight: 700, ml: 0.5 }}>
                    {tier.period}
                  </Typography>
                )}
              </Box>

              <Stack spacing={1.5} sx={{ mb: 4, flex: 1 }}>
                {tier.features.map((feature) => (
                  <Stack key={feature} direction="row" spacing={1.2} alignItems="center">
                    <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tier.color }} />
                    <Typography sx={{ fontSize: 13, color: "#4a3f36", fontWeight: 600 }}>
                      {feature}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant={tier.popular ? "contained" : "outlined"}
                fullWidth
                sx={{
                  borderRadius: 3.5,
                  py: 1.4,
                  fontWeight: 800,
                  fontSize: 13.5,
                  textTransform: "none",
                  bgcolor: tier.popular ? "#5c3d2e" : "transparent",
                  borderColor: tier.popular ? "#5c3d2e" : "#d9cab7",
                  color: tier.popular ? "#fff" : "#5c3d2e",
                  "&:hover": {
                    bgcolor: tier.popular ? "#7a5240" : alpha("#5c3d2e", 0.05),
                    borderColor: tier.popular ? "#7a5240" : "#c4956a",
                  },
                }}
              >
                {tier.price === "Free" ? "Current Plan" : "Upgrade Now"}
              </Button>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
