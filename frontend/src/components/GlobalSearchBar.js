import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Button,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';

const GlobalSearchBar = ({ theme, onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mimeTypes: [],
    tags: [],
    dateFrom: '',
    dateTo: '',
  });

  const searchRef = useRef(null);
  const userId = localStorage.getItem('userId');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() && userId) {
        performSemanticSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  const performSemanticSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const requestBody = {
        userId,
        query: searchQuery,
        topK: 10,
        filters: {
          mimeTypes: filters.mimeTypes.length > 0 ? filters.mimeTypes : undefined,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      };

      const response = await axios.post(
        'https://docuthinker-app-backend-api.vercel.app/v1/search/semantic',
        requestBody
      );

      if (response.data && response.data.results) {
        setResults(response.data.results);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const updateFilter = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <PdfIcon fontSize="small" />;
    if (mimeType?.includes('document')) return <DocumentIcon fontSize="small" />;
    return <FileIcon fontSize="small" />;
  };

  const formatScore = (score) => {
    return `${Math.round((1 - score) * 100)}% match`;
  };

  const formatSnippet = (snippet, searchQuery) => {
    if (!snippet || !searchQuery) return snippet;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return snippet.replace(regex, '<mark>$1</mark>');
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        ref={searchRef}
        fullWidth
        placeholder="Search across all your documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            '& fieldset': {
              borderColor: theme === 'dark' ? '#555' : '#ddd',
            },
            '&:hover fieldset': {
              borderColor: theme === 'dark' ? '#777' : '#bbb',
            },
            '&.Mui-focused fieldset': {
              borderColor: theme === 'dark' ? '#1976d2' : '#1976d2',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: theme === 'dark' ? '#aaa' : '#666',
            opacity: 1,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon sx={{ color: theme === 'dark' ? '#aaa' : '#666' }} />
              )}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleFilters}
                size="small"
                sx={{ color: theme === 'dark' ? '#aaa' : '#666' }}
              >
                <FilterIcon />
              </IconButton>
              {query && (
                <IconButton
                  onClick={clearSearch}
                  size="small"
                  sx={{ color: theme === 'dark' ? '#aaa' : '#666' }}
                >
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Filters Panel */}
      <Collapse in={showFilters}>
        <Paper
          sx={{
            mt: 1,
            p: 2,
            backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Search Filters
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            {/* MIME Type Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>File Types</InputLabel>
              <Select
                multiple
                value={filters.mimeTypes}
                onChange={(e) => updateFilter('mimeTypes', e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                <MenuItem value="application/pdf">PDF</MenuItem>
                <MenuItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</MenuItem>
                <MenuItem value="text/plain">TXT</MenuItem>
                <MenuItem value="text/markdown">MD</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range Filters */}
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            <Button
              size="small"
              onClick={() => setFilters({ mimeTypes: [], tags: [], dateFrom: '', dateTo: '' })}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Search Results Dropdown */}
      <Popper
        open={isOpen && results.length > 0}
        anchorEl={searchRef.current}
        placement="bottom-start"
        style={{ width: searchRef.current?.offsetWidth, zIndex: 1300 }}
      >
        <Paper
          elevation={8}
          sx={{
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
            maxHeight: 400,
            overflow: 'auto',
            mt: 1,
          }}
        >
          <List dense>
            {results.map((result, index) => (
              <React.Fragment key={result.docId}>
                <ListItem
                  button
                  onClick={() => handleResultClick(result)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    {getFileIcon(result.mimeType)}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        ml: 1,
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        flex: 1,
                      }}
                    >
                      {result.title}
                    </Typography>
                    <Chip
                      label={formatScore(result.score)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme === 'dark' ? '#cccccc' : '#666666',
                      mb: 1,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatSnippet(result.snippet, query),
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {result.tags && result.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                    {result.location && (
                      <Chip
                        label={result.location}
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                </ListItem>
                
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          {results.length > 0 && (
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Showing {results.length} results for "{query}"
              </Typography>
            </Box>
          )}
        </Paper>
      </Popper>

      {/* Click outside to close */}
      {isOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
};

export default GlobalSearchBar;