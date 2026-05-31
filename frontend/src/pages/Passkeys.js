import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import {
  listPasskeys,
  registerPasskey,
  renamePasskey,
  deletePasskey,
  isPasskeySupported,
} from "../utils/passkeys";

const ORANGE = "#f57c00";

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return null;
  }
};

const Passkeys = ({ theme }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const dark = theme === "dark";

  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const supported = isPasskeySupported();

  const notify = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const data = await listPasskeys(userId);
      setPasskeys(data);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.error) ||
          "Could not load your passkeys. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    load();
  }, [userId, navigate, load]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await registerPasskey(userId, addName.trim() || undefined);
      setAddOpen(false);
      setAddName("");
      notify("Passkey added successfully.");
      await load();
    } catch (err) {
      notify(err.message || "Could not create a passkey.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    setRenaming(true);
    try {
      await renamePasskey(userId, renameTarget.id, renameValue.trim());
      setRenameTarget(null);
      notify("Passkey renamed.");
      await load();
    } catch (err) {
      notify(
        (err.response && err.response.data && err.response.data.error) ||
          "Could not rename the passkey.",
        "error",
      );
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePasskey(userId, deleteTarget.id);
      setDeleteTarget(null);
      notify("Passkey removed.");
      await load();
    } catch (err) {
      notify(
        (err.response && err.response.data && err.response.data.error) ||
          "Could not remove the passkey.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const dialogPaperSx = {
    bgcolor: dark ? "#2a2a2a" : "white",
    color: dark ? "white" : "black",
    borderRadius: "14px",
    fontFamily: "Poppins, sans-serif",
    width: { xs: "92%", sm: "420px" },
  };

  const textFieldSx = {
    mt: 1,
    backgroundColor: dark ? "#3a3a3a" : "#fff",
    borderRadius: "8px",
    input: {
      color: dark ? "white" : "black",
      fontFamily: "Poppins, sans-serif",
      "&::placeholder": {
        fontFamily: "Poppins, sans-serif",
        opacity: dark ? 0.6 : 0.55,
      },
    },
  };

  const inputLabelSx = {
    color: dark ? "#bbb" : "#666",
    fontFamily: "Poppins, sans-serif",
  };

  const tooltipSlotProps = {
    tooltip: {
      sx: { fontFamily: "Poppins, sans-serif", fontSize: "12px" },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
        transition: "background-color 0.3s ease",
        py: { xs: 3, md: 5 },
        px: 2,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Box sx={{ maxWidth: "760px", mx: "auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <FingerprintIcon sx={{ fontSize: 38, color: ORANGE }} />
            <Box>
              <Typography
                sx={{
                  font: "inherit",
                  fontWeight: 700,
                  fontSize: { xs: "26px", md: "30px" },
                  color: ORANGE,
                  lineHeight: 1.1,
                }}
              >
                Passkeys
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "14px",
                  color: dark ? "#bbb" : "#666",
                }}
              >
                Password-free sign-in with your fingerprint, face, or device
                PIN.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!supported}
            onClick={() => {
              setAddName("");
              setAddOpen(true);
            }}
            sx={{
              bgcolor: ORANGE,
              color: "white",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              py: 1,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#e65100" },
            }}
          >
            Add a passkey
          </Button>
        </Box>

        {!supported && (
          <Alert
            severity="warning"
            sx={{ font: "inherit", mb: 3, borderRadius: "10px" }}
          >
            This browser or device doesn't support passkeys. You can still
            manage existing passkeys here, but you'll need a compatible device
            to add a new one.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ font: "inherit", mb: 3, borderRadius: "10px" }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={load}
                sx={{ font: "inherit" }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Body */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        ) : passkeys.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 7,
              px: 3,
              borderRadius: "16px",
              border: `2px dashed ${dark ? "#444" : "#ddd"}`,
              bgcolor: dark ? "#262626" : "white",
            }}
          >
            <VpnKeyIcon
              sx={{ fontSize: 56, color: dark ? "#555" : "#ccc", mb: 1 }}
            />
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 600,
                fontSize: "18px",
                mb: 0.5,
                color: dark ? "#f5f5f5" : "#1a1a1a",
              }}
            >
              No passkeys yet
            </Typography>
            <Typography
              sx={{
                font: "inherit",
                fontSize: "14px",
                color: dark ? "#bbb" : "#666",
                mb: 3,
                maxWidth: "420px",
                mx: "auto",
              }}
            >
              Add a passkey to sign in without typing your password. Your device
              keeps the key safe and never shares it.
            </Typography>
            <Button
              variant="contained"
              startIcon={<FingerprintIcon />}
              disabled={!supported}
              onClick={() => {
                setAddName("");
                setAddOpen(true);
              }}
              sx={{
                bgcolor: ORANGE,
                color: "white",
                font: "inherit",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "10px",
                px: 3,
                py: 1,
                "&:hover": { bgcolor: "#e65100" },
              }}
            >
              Add your first passkey
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {passkeys.map((pk) => {
              const created = formatDate(pk.createdAt);
              const lastUsed = formatDate(pk.lastUsedAt);
              return (
                <Box
                  key={pk.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: dark ? "#262626" : "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: dark
                        ? "rgba(245,124,0,0.16)"
                        : "rgba(245,124,0,0.12)",
                      color: ORANGE,
                    }}
                  >
                    <VpnKeyIcon />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          font: "inherit",
                          fontWeight: 600,
                          fontSize: "16px",
                          color: dark ? "white" : "#222",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: { xs: "150px", sm: "320px" },
                        }}
                      >
                        {pk.name}
                      </Typography>
                      <Chip
                        size="small"
                        icon={
                          pk.backedUp ? (
                            <CloudDoneIcon sx={{ fontSize: 15 }} />
                          ) : (
                            <SmartphoneIcon sx={{ fontSize: 15 }} />
                          )
                        }
                        label={pk.backedUp ? "Synced" : "This device"}
                        sx={{
                          font: "inherit",
                          fontSize: "11px",
                          height: 22,
                          color: pk.backedUp
                            ? "#2e7d32"
                            : dark
                              ? "#bbb"
                              : "#666",
                          bgcolor: pk.backedUp
                            ? "rgba(46,125,50,0.12)"
                            : dark
                              ? "#333"
                              : "#f0f0f0",
                          "& .MuiChip-icon": {
                            color: pk.backedUp
                              ? "#2e7d32"
                              : dark
                                ? "#bbb"
                                : "#666",
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        font: "inherit",
                        fontSize: "12.5px",
                        color: dark ? "#999" : "#888",
                        mt: 0.3,
                      }}
                    >
                      {created ? `Added ${created}` : "Recently added"}
                      {"  ·  "}
                      {lastUsed ? `Last used ${lastUsed}` : "Never used"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Rename" slotProps={tooltipSlotProps}>
                      <IconButton
                        onClick={() => {
                          setRenameTarget(pk);
                          setRenameValue(pk.name);
                        }}
                        sx={{
                          color: dark ? "#bbb" : "#666",
                          "&:hover": { color: ORANGE },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove" slotProps={tooltipSlotProps}>
                      <IconButton
                        onClick={() => setDeleteTarget(pk)}
                        sx={{
                          color: "#d32f2f",
                          "&:hover": { color: "#b71c1c" },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Add passkey dialog */}
      <Dialog
        open={addOpen}
        onClose={() => (adding ? null : setAddOpen(false))}
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={{ font: "inherit", fontWeight: 700, color: ORANGE }}>
          Add a passkey
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              font: "inherit",
              fontSize: "14px",
              color: dark ? "#bbb" : "#666",
            }}
          >
            Give this passkey a name so you can recognize it later. Your browser
            will then ask you to confirm with your device.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            placeholder="e.g., MacBook Touch ID"
            label="Passkey name (optional)"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            inputProps={{ maxLength: 60 }}
            sx={{ ...textFieldSx, mt: 3 }}
            InputLabelProps={{ style: inputLabelSx }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAddOpen(false)}
            disabled={adding}
            sx={{
              font: "inherit",
              textTransform: "none",
              color: dark ? "#bbb" : "#666",
              "&:hover": {
                bgcolor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={adding}
            variant="contained"
            startIcon={!adding ? <FingerprintIcon /> : null}
            sx={{
              bgcolor: ORANGE,
              color: "white",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#e65100" },
            }}
          >
            {adding ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Continue"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onClose={() => (renaming ? null : setRenameTarget(null))}
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={{ font: "inherit", fontWeight: 700, color: ORANGE }}>
          Rename passkey
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Passkey name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            inputProps={{ maxLength: 60 }}
            sx={textFieldSx}
            InputLabelProps={{ style: inputLabelSx }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRenameTarget(null)}
            disabled={renaming}
            sx={{
              font: "inherit",
              textTransform: "none",
              color: dark ? "#bbb" : "#666",
              "&:hover": {
                bgcolor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={renaming || !renameValue.trim()}
            variant="contained"
            sx={{
              bgcolor: ORANGE,
              color: "white",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#e65100" },
            }}
          >
            {renaming ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={{ font: "inherit", fontWeight: 700 }}>
          Remove passkey?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              font: "inherit",
              fontSize: "14px",
              color: dark ? "#bbb" : "#666",
            }}
          >
            {deleteTarget ? (
              <>
                You won't be able to sign in with{" "}
                <strong>{deleteTarget.name}</strong> anymore. This can't be
                undone, but you can always add a new passkey later.
              </>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <Divider sx={{ borderColor: dark ? "#3a3a3a" : "#eee" }} />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{
              font: "inherit",
              textTransform: "none",
              color: dark ? "#bbb" : "#666",
              "&:hover": {
                bgcolor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            sx={{
              bgcolor: "#d32f2f",
              color: "white",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#b71c1c" },
            }}
          >
            {deleting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Remove"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{
            fontFamily: "Poppins, sans-serif",
            width: "100%",
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Passkeys;
