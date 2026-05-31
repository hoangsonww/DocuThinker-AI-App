import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Visibility,
  Edit,
  Save,
  Search as SearchIcon,
  Close as CloseIcon,
  SwapVert as SwapVertIcon,
  FilterList as FilterListIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  TextSnippet as TextSnippetIcon,
  Article as ArticleIcon,
  Notes as NotesIcon,
  Html as HtmlIcon,
  TableChart as TableChartIcon,
  DataObject as DataObjectIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ORANGE = "#f57c00";

const DocumentsPage = ({ theme }) => {
  const dark = theme === "dark";
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(5);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [openDeleteAllDialog, setOpenDeleteAllDialog] = useState(false);
  const [viewingDocId, setViewingDocId] = useState(null);

  // Search / sort / filter (all client-side over the fetched documents).
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");

  // --- theme tokens ---
  const cardBg = dark ? "#2a2a2a" : "#ffffff";
  const pageText = dark ? "#ffffff" : "#1a1a1a";
  const subText = dark ? "#b5b5b5" : "#666";
  const cardBorder = dark ? "1px solid #3a3a3a" : "1px solid #ececec";
  const fieldBg = dark ? "#333" : "#fafafa";

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          `https://docuthinker-app-backend-api.vercel.app/documents/${userId}`,
        );
        const documentsData = response.data;
        const documentsList = Object.keys(documentsData)
          .filter((key) => key !== "message")
          .map((key) => documentsData[key]);

        setDocuments(documentsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  // Reset to first page whenever the filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, typeFilter]);

  const docType = (doc) => {
    const t = (doc.fileType || "").toLowerCase();
    if (t.includes("pdf")) return "pdf";
    if (t.includes("word") || t.includes("officedocument")) return "docx";
    if (t.includes("markdown")) return "markdown";
    if (t.includes("html")) return "html";
    if (t.includes("csv") || t.includes("tab-separated")) return "csv";
    if (t.includes("json")) return "json";
    return "text";
  };

  const typeMeta = {
    pdf: { label: "PDF", color: "#d32f2f", Icon: PictureAsPdfIcon },
    docx: { label: "Word", color: "#1565c0", Icon: DescriptionIcon },
    markdown: { label: "Markdown", color: "#6d4caf", Icon: NotesIcon },
    html: { label: "HTML", color: "#e44d26", Icon: HtmlIcon },
    csv: { label: "CSV", color: "#2e7d32", Icon: TableChartIcon },
    json: { label: "JSON", color: "#b8860b", Icon: DataObjectIcon },
    text: {
      label: "Text",
      color: dark ? "#9e9e9e" : "#757575",
      Icon: TextSnippetIcon,
    },
  };

  // Build the displayed list: filter by type, search title/summary, then sort.
  const processedDocuments = useMemo(() => {
    let list = documents.map((d, i) => ({ ...d, _idx: i }));

    if (typeFilter !== "all") {
      list = list.filter((d) => docType(d) === typeFilter);
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const title = (d.title || "").toLowerCase();
        const summary = (d.summary || "").toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

    const byTitle = (a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      });

    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => a._idx - b._idx);
        break;
      case "az":
        list.sort(byTitle);
        break;
      case "za":
        list.sort((a, b) => byTitle(b, a));
        break;
      case "newest":
      default:
        list.sort((a, b) => b._idx - a._idx);
        break;
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, searchTerm, sortBy, typeFilter]);

  const totalPages = Math.ceil(processedDocuments.length / documentsPerPage);
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = processedDocuments.slice(
    indexOfFirstDocument,
    indexOfLastDocument,
  );

  const handleViewDocument = async (docId) => {
    if (viewingDocId) return; // already opening one
    setViewingDocId(docId);
    try {
      const response = await axios.get(
        `https://docuthinker-app-backend-api.vercel.app/document-details/${userId}/${docId}`,
      );
      const { title, summary, originalText, originalHtml, fileUrl, fileType } =
        response.data;
      navigate("/home", {
        state: {
          title,
          summary,
          originalText,
          originalHtml,
          fileUrl,
          fileType,
        },
      });
    } catch (error) {
      console.error("Error viewing document:", error);
      setViewingDocId(null);
    }
  };

  const handleNewDocClick = () => {
    navigate("/home");
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(
        `https://docuthinker-app-backend-api.vercel.app/documents/${userId}/${docId}`,
      );
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleOpenDeleteAllDialog = () => setOpenDeleteAllDialog(true);
  const handleCloseDeleteAllDialog = () => setOpenDeleteAllDialog(false);

  const handleConfirmDeleteAllDocuments = async () => {
    try {
      await axios.delete(
        `https://docuthinker-app-backend-api.vercel.app/documents/${userId}`,
      );
      setDocuments([]);
      handleCloseDeleteAllDialog();
    } catch (error) {
      console.error("Error deleting all documents:", error);
      handleCloseDeleteAllDialog();
    }
  };

  const handleEditDocument = (docId, currentTitle) => {
    setEditingDocId(docId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (docId) => {
    try {
      const currentDoc = documents.find((doc) => doc.id === docId);
      if (currentDoc && currentDoc.title === newTitle) {
        setEditingDocId(null);
        setNewTitle("");
        return;
      }

      await axios.post(
        `https://docuthinker-app-backend-api.vercel.app/update-document-title`,
        { userId, docId, newTitle },
      );

      setDocuments(
        documents.map((doc) =>
          doc.id === docId ? { ...doc, title: newTitle } : doc,
        ),
      );
      setEditingDocId(null);
      setNewTitle("");
    } catch (error) {
      console.error("Error updating document title:", error);
    }
  };

  const handleKeyPress = (event, docId) => {
    if (event.key === "Enter") handleSaveTitle(docId);
  };

  const handlePageChange = (event, value) => setCurrentPage(value);

  // Shared styling for the Select controls.
  const selectSx = {
    bgcolor: fieldBg,
    borderRadius: "10px",
    color: pageText,
    fontFamily: "Poppins, sans-serif",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: dark ? "#444" : "#ddd",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: ORANGE,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: ORANGE,
    },
    "& .MuiSvgIcon-root": { color: subText },
  };
  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: cardBg,
        color: pageText,
        "& .MuiMenuItem-root": { fontFamily: "Poppins, sans-serif" },
        "& .Mui-selected": {
          bgcolor: dark ? "rgba(245,124,0,0.18)" : "rgba(245,124,0,0.1)",
        },
      },
    },
  };
  const labelSx = {
    color: subText,
    fontFamily: "Poppins, sans-serif",
    "&.Mui-focused": { color: ORANGE },
  };

  if (!userId) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          px: 2,
          backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            textAlign: "center",
            maxWidth: "440px",
            borderRadius: "18px",
            bgcolor: cardBg,
            border: cardBorder,
            boxShadow: dark
              ? "0 2px 12px rgba(0,0,0,0.35)"
              : "0 2px 14px rgba(0,0,0,0.06)",
          }}
        >
          <ArticleIcon sx={{ fontSize: 56, color: ORANGE, mb: 1 }} />
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: "20px",
              color: pageText,
              mb: 1,
            }}
          >
            You're not signed in
          </Typography>
          <Typography
            sx={{ font: "inherit", fontSize: "14px", color: subText }}
          >
            Please{" "}
            <a href="/login" style={{ color: ORANGE, fontWeight: 600 }}>
              log in
            </a>{" "}
            to view your documents.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
        }}
      >
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  const renderDocRow = (doc) => {
    const meta = typeMeta[docType(doc)];
    const TypeIcon = meta.Icon;
    return (
      <ListItem
        key={doc.id}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          borderRadius: "12px",
          gap: 1,
          mb: 1,
          border: cardBorder,
          bgcolor: cardBg,
          "@media (min-width:600px)": {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          "&:hover": {
            borderColor: ORANGE,
            transition: "border-color 0.2s ease",
          },
        }}
      >
        {editingDocId === doc.id ? (
          <TextField
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, doc.id)}
            variant="outlined"
            size="small"
            label="Enter new title"
            sx={{ mt: 2, mb: 1, width: "100%" }}
            inputProps={{
              style: {
                fontFamily: "Poppins, sans-serif",
                color: pageText,
              },
            }}
            InputLabelProps={{
              style: { fontFamily: "Poppins, sans-serif", color: subText },
            }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: meta.color,
                bgcolor: dark ? "rgba(255,255,255,0.06)" : "#f4f5f7",
              }}
            >
              <TypeIcon fontSize="small" />
            </Box>
            <ListItemText
              sx={{ my: 0 }}
              primary={
                <Typography
                  sx={{
                    font: "inherit",
                    fontWeight: 600,
                    wordBreak: "break-word",
                    color: pageText,
                  }}
                >
                  {doc.title}
                </Typography>
              }
              secondary={
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "Poppins, sans-serif",
                    color: meta.color,
                    bgcolor: dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  }}
                />
              }
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 0.5,
            mt: { xs: 1, sm: 0 },
            flexShrink: 0,
          }}
        >
          {editingDocId === doc.id ? (
            <Tooltip title="Save">
              <IconButton
                onClick={() => handleSaveTitle(doc.id)}
                sx={{ color: ORANGE }}
              >
                <Save />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <Tooltip title={viewingDocId === doc.id ? "Opening…" : "View"}>
                <span>
                  <IconButton
                    onClick={() => handleViewDocument(doc.id)}
                    disabled={!!viewingDocId}
                    sx={{
                      color: subText,
                      "&:hover": { color: ORANGE, transform: "scale(1.12)" },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {viewingDocId === doc.id ? (
                      <CircularProgress size={20} sx={{ color: ORANGE }} />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Rename">
                <IconButton
                  onClick={() => handleEditDocument(doc.id, doc.title)}
                  sx={{
                    color: subText,
                    "&:hover": { color: ORANGE, transform: "scale(1.12)" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  onClick={() => handleDeleteDocument(doc.id)}
                  sx={{
                    color: "#e53935",
                    "&:hover": { color: "#b71c1c", transform: "scale(1.12)" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
        p: { xs: 2, md: 4 },
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Box sx={{ maxWidth: "1280px", mx: "auto" }}>
        <Typography
          variant="h4"
          sx={{
            font: "inherit",
            fontWeight: 700,
            fontSize: { xs: "26px", md: "32px" },
            color: pageText,
            mb: 0.5,
          }}
        >
          Your Analyzed Documents
        </Typography>
        <Typography
          sx={{ font: "inherit", fontSize: "14px", color: subText, mb: 3 }}
        >
          Search, sort, and filter through everything you've analyzed.
        </Typography>

        {/* ===== Search / sort / filter toolbar ===== */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 3,
            borderRadius: "16px",
            bgcolor: cardBg,
            border: cardBorder,
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
              alignItems: { md: "center" },
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="Search by title or summary..."
              sx={{
                flexGrow: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: fieldBg,
                  "& fieldset": { borderColor: dark ? "#444" : "#ddd" },
                  "&:hover fieldset": { borderColor: ORANGE },
                  "&.Mui-focused fieldset": { borderColor: ORANGE },
                },
                "& input": {
                  fontFamily: "Poppins, sans-serif",
                  color: pageText,
                },
                "& input::placeholder": {
                  fontFamily: "Poppins, sans-serif",
                  opacity: dark ? 0.6 : 0.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: subText }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm("")}
                      sx={{ color: subText }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", md: 160 } }}
            >
              <InputLabel sx={labelSx}>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                MenuProps={menuProps}
                startAdornment={
                  <SwapVertIcon
                    sx={{ color: subText, fontSize: 18, mr: 0.5 }}
                  />
                }
                sx={selectSx}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
                <MenuItem value="az">Title A–Z</MenuItem>
                <MenuItem value="za">Title Z–A</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", md: 150 } }}
            >
              <InputLabel sx={labelSx}>Type</InputLabel>
              <Select
                label="Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                MenuProps={menuProps}
                startAdornment={
                  <FilterListIcon
                    sx={{ color: subText, fontSize: 18, mr: 0.5 }}
                  />
                }
                sx={selectSx}
              >
                <MenuItem value="all">All types</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="docx">Word</MenuItem>
                <MenuItem value="markdown">Markdown</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="csv">CSV / TSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="text">Text</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Result count + active-filter chips */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 1.75,
            }}
          >
            <Typography
              sx={{ font: "inherit", fontSize: "13px", color: subText }}
            >
              {processedDocuments.length} of {documents.length} document
              {documents.length === 1 ? "" : "s"}
            </Typography>
            {typeFilter !== "all" && (
              <Chip
                size="small"
                label={typeMeta[typeFilter].label}
                onDelete={() => setTypeFilter("all")}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "11px",
                  color: ORANGE,
                  bgcolor: dark
                    ? "rgba(245,124,0,0.16)"
                    : "rgba(245,124,0,0.1)",
                  "& .MuiChip-deleteIcon": { color: ORANGE },
                }}
              />
            )}
            {searchTerm && (
              <Chip
                size="small"
                label={`"${searchTerm}"`}
                onDelete={() => setSearchTerm("")}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "11px",
                  color: ORANGE,
                  bgcolor: dark
                    ? "rgba(245,124,0,0.16)"
                    : "rgba(245,124,0,0.1)",
                  "& .MuiChip-deleteIcon": { color: ORANGE },
                }}
              />
            )}
          </Box>
        </Paper>

        {/* ===== Actions ===== */}
        {documents.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleOpenDeleteAllDialog}
              sx={{
                font: "inherit",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                color: "#e53935",
                borderColor: "#e53935",
                "&:hover": {
                  borderColor: "#b71c1c",
                  bgcolor: "rgba(229,57,53,0.06)",
                },
              }}
            >
              Delete All Documents
            </Button>
            <Button
              variant="contained"
              onClick={handleNewDocClick}
              sx={{
                font: "inherit",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                bgcolor: ORANGE,
                "&:hover": { bgcolor: "#e65100" },
              }}
            >
              Upload New Document
            </Button>
          </Box>
        )}

        {/* ===== Document list ===== */}
        {documents.length === 0 ? (
          <Typography
            sx={{
              font: "inherit",
              color: subText,
              textAlign: "center",
              py: 6,
            }}
          >
            No documents found. Upload one to get started.
          </Typography>
        ) : processedDocuments.length === 0 ? (
          <Typography
            sx={{
              font: "inherit",
              color: subText,
              textAlign: "center",
              py: 6,
            }}
          >
            No documents match your search or filters.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>{currentDocuments.map(renderDocRow)}</List>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 3,
              "& .MuiPaginationItem-root": {
                fontFamily: "Poppins, sans-serif",
                color: pageText,
              },
              "& .Mui-selected": {
                backgroundColor: `${ORANGE} !important`,
                color: "#fff",
              },
            }}
          />
        )}
      </Box>

      <Dialog
        open={openDeleteAllDialog}
        onClose={handleCloseDeleteAllDialog}
        PaperProps={{
          style: {
            backgroundColor: cardBg,
            color: pageText,
            borderRadius: "14px",
          },
        }}
      >
        <DialogTitle
          sx={{ font: "inherit", fontWeight: 700, color: "#e53935" }}
        >
          Delete all documents?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ color: subText, font: "inherit", fontSize: "14px" }}
          >
            Are you sure you want to delete all documents? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteAllDialog}
            sx={{
              color: subText,
              font: "inherit",
              textTransform: "none",
              "&:hover": {
                bgcolor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteAllDocuments}
            autoFocus
            variant="contained"
            sx={{
              font: "inherit",
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#e53935",
              "&:hover": { bgcolor: "#b71c1c" },
            }}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;
