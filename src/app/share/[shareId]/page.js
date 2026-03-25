import { Box, Button, Container, Stack, Typography } from "@mui/material";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { alpha } from "@mui/material/styles";
import ShareCountdown from "@/components/docbook/share/ShareCountdown";
import { getSharedNoteState, sanitizeSharedHtml } from "@/lib/sharedNotes";

export const dynamic = "force-dynamic";

function SharedNoteShell({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fffaf3 0%, #f6efe5 42%, #efe4d6 100%)",
        px: 2,
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="md">{children}</Container>
    </Box>
  );
}

function SharedNoteEmptyState({ title, description, expiredAt = "" }) {
  return (
    <SharedNoteShell>
      <Box
        sx={{
          borderRadius: 6,
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(252,247,240,0.98) 100%)",
          border: "1px solid rgba(120, 93, 63, 0.12)",
          boxShadow: "0 28px 80px rgba(73, 53, 31, 0.14)",
        }}
      >
        <Box
          sx={{
            px: { xs: 3, md: 4 },
            py: { xs: 3, md: 4 },
            borderBottom: "1px solid rgba(120, 93, 63, 0.08)",
            background: "linear-gradient(135deg, rgba(255, 243, 224, 0.9) 0%, rgba(255, 251, 245, 0.95) 100%)",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8b6b4f", mb: 1 }}>
            DocBook Shared Note
          </Typography>
          <Typography sx={{ fontSize: { xs: 28, md: 38 }, lineHeight: 1.08, fontWeight: 800, color: "#2d241d", letterSpacing: "-0.03em", mb: 1.2 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#5f5146", maxWidth: 620 }}>
            {description}
          </Typography>
          {expiredAt ? (
            <Typography sx={{ mt: 1.5, fontSize: 13, fontWeight: 600, color: "#9a4d43" }}>
              Expired on {new Date(expiredAt).toLocaleString()}
            </Typography>
          ) : null}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
          <Button href="/" variant="contained" startIcon={<ArrowBackRoundedIcon />} sx={{ borderRadius: 999, bgcolor: "#2d241d", "&:hover": { bgcolor: "#1f1712" } }}>
            Open DocBook
          </Button>
        </Stack>
      </Box>
    </SharedNoteShell>
  );
}

export default async function SharedNotePage({ params }) {
  const { shareId } = await params;
  const { status, document } = await getSharedNoteState(shareId);

  if (status === "missing") {
    return <SharedNoteEmptyState title="Share link unavailable" description="This shared note no longer exists or the link is invalid." />;
  }

  if (status === "expired") {
    return (
      <SharedNoteEmptyState
        title="This shared note expired"
        description="The owner set an expiry time for this link. Ask them to generate a new share link if you still need access."
        expiredAt={document?.expiresAt || ""}
      />
    );
  }

  const note = document.note || {};
  const accent = note.color || "#F7E36D";

  return (
    <SharedNoteShell>
      <Box
        sx={{
          borderRadius: 6,
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(252,247,240,0.98) 100%)",
          border: `1px solid ${alpha(accent, 0.4)}`,
          boxShadow: `0 28px 80px ${alpha("#49351f", 0.14)}`,
        }}
      >
        <Box
          sx={{
            px: { xs: 3, md: 4 },
            py: { xs: 3, md: 4 },
            borderBottom: "1px solid rgba(120, 93, 63, 0.08)",
            background: `linear-gradient(135deg, ${alpha(accent, 0.34)} 0%, rgba(255, 251, 245, 0.96) 100%)`,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8b6b4f", mb: 1 }}>
                DocBook Shared Note
              </Typography>
              <Typography sx={{ fontSize: { xs: 28, md: 42 }, lineHeight: 1.05, fontWeight: 800, color: "#2d241d", letterSpacing: "-0.04em", wordBreak: "break-word" }}>
                {note.title || "Untitled"}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
              <ShareCountdown expiresAt={document.expiresAt} />
              <Button
                href="/"
                variant="outlined"
                startIcon={<LaunchRoundedIcon />}
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#2d241d", 0.18),
                  color: "#2d241d",
                }}
              >
                Open DocBook
              </Button>
            </Stack>
          </Stack>

          <Typography sx={{ mt: 1.5, fontSize: 13.5, color: "#5f5146" }}>
            Shared {document.createdAt ? new Date(document.createdAt).toLocaleString() : "recently"}
          </Typography>
        </Box>

        <Box
          sx={{
            px: { xs: 3, md: 5 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              maxWidth: 820,
              margin: "0 auto",
              color: "#31271f",
              fontSize: `${(note.fontScale || 1) * 1}rem`,
              lineHeight: 1.75,
              wordBreak: "break-word",
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                color: "#201914",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                mb: 1.2,
                mt: 2.4,
              },
              "& p": {
                mb: 1.2,
              },
              "& ul, & ol": {
                pl: 3,
                mb: 1.5,
              },
              "& blockquote": {
                pl: 2,
                py: 1,
                borderLeft: `3px solid ${alpha(accent, 0.8)}`,
                color: "#5f5146",
                bgcolor: alpha(accent, 0.1),
                borderRadius: 2,
                mb: 1.5,
              },
              "& img": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: 3,
                boxShadow: "0 16px 36px rgba(44, 31, 18, 0.12)",
              },
              "& a": {
                color: "#8b5e3c",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              },
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeSharedHtml(note.content || "<p></p>") }}
          />
        </Box>
      </Box>
    </SharedNoteShell>
  );
}
