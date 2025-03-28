import React, { useState } from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const useErrorToast = () => {
  const [errorToastOpen, setErrorToastOpen] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState("");

  const showErrorToast = (message) => {
    setErrorToastMessage(message);
    setErrorToastOpen(true);
  };

  const handleErrorToastClose = (event, reason) => {
    if (reason === "clickaway") return;
    setErrorToastOpen(false);
  };

  const ErrorToastComponent = (
    <Snackbar
      open={errorToastOpen}
      autoHideDuration={6000}
      onClose={handleErrorToastClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ fontFamily: "Poppins, sans-serif" }}
    >
      <Alert
        onClose={handleErrorToastClose}
        severity="error"
        sx={{ width: "100%", fontFamily: "Poppins, sans-serif" }}
      >
        {errorToastMessage}
      </Alert>
    </Snackbar>
  );

  return { showErrorToast, ErrorToastComponent };
};
