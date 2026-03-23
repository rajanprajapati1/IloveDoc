"use client";

import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import changelogData from "./changelog.json";

export default function ChangelogPanel({ accentColor = "#fff" }) {
  return (
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
          background: `linear-gradient(160deg, ${alpha(accentColor, 0.16)} 0%, rgba(255,251,245,0.92) 28%, rgba(246,239,229,0.92) 100%)`,
          border: `1px solid ${alpha(accentColor, 0.16)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 40px ${alpha("#7b5f39", 0.08)}`,
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            px: { xs: 2.2, md: 6 },
            py: { xs: 2.4, md: 4.5 },
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": { background: alpha("#8f7d66", 0.22), borderRadius: 999 },
          }}
        >
          <Box sx={{ maxWidth: 780, mx: "auto", pb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#8bc34a", 0.16),
                  color: "#6b9630",
                }}
              >
                <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 800, letterSpacing: "-0.03em", color: "#2d241d" }}>
                {changelogData.title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1, mb: 3.5 }}>
              <Stack direction="row" spacing={0.6} alignItems="center">
                <AccessTimeRoundedIcon sx={{ fontSize: 16, color: "#8a7767" }} />
                <Typography sx={{ fontSize: 13, color: "#7b6c5c" }}>{changelogData.subtitle}</Typography>
              </Stack>
              <Chip
                icon={<SellOutlinedIcon />}
                label={changelogData.status}
                size="small"
                sx={{
                  bgcolor: alpha("#60a5fa", 0.12),
                  color: "#2d6fbf",
                  fontWeight: 700,
                  borderRadius: 999,
                  "& .MuiChip-icon": { color: "inherit", fontSize: 16 },
                }}
              />
            </Stack>

            <Stack spacing={3.5}>
              {changelogData.releases.map((entry, index) => (
                <Box key={entry.date}>
                  {index > 0 && <Divider sx={{ mb: 3, borderColor: alpha("#8f7d66", 0.12) }} />}
                  <Typography sx={{ fontSize: 25, fontWeight: 800, color: "#342922", mb: 0.9 }}>
                    {entry.date}
                  </Typography>
                  <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#51453b", mb: 1 }}>
                    {entry.title}
                  </Typography>
                  <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, color: "#6a5d52", mb: 1.4 }}>
                    {entry.summary}
                  </Typography>
                  <Stack spacing={1}>
                    {entry.changes.map((item) => (
                      <Typography key={item} sx={{ fontSize: 15, lineHeight: 1.65, color: "#64574b" }}>
                        <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>
                          +
                        </Box>{" "}
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                  <Box sx={{ mt: 1.8 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#7b6c5c", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                      How To Use
                    </Typography>
                    <Stack spacing={0.75}>
                      {entry.how_to_use.map((step, index2) => (
                        <Typography key={step} sx={{ fontSize: 14.25, lineHeight: 1.6, color: "#64574b" }}>
                          <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>
                            {index2 + 1}.
                          </Box>{" "}
                          {step}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 4, borderColor: alpha("#8f7d66", 0.12) }} />

            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#342922", mb: 1.2 }}>
                Feature Guide
              </Typography>
              <Stack spacing={2}>
                {changelogData.features.map((feature) => (
                  <Box
                    key={feature.name}
                    sx={{
                      p: 1.45,
                      borderRadius: 3,
                      bgcolor: alpha("#fffdf8", 0.72),
                      border: `1px solid ${alpha(accentColor, 0.14)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#352a22", mb: 0.45 }}>
                      {feature.name}
                    </Typography>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: "#6a5d52", mb: 1 }}>
                      {feature.description}
                    </Typography>
                    <Stack spacing={0.65}>
                      {feature.how_to_use.map((step) => (
                        <Typography key={step} sx={{ fontSize: 14, lineHeight: 1.55, color: "#64574b" }}>
                          <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>
                            •
                          </Box>{" "}
                          {step}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
