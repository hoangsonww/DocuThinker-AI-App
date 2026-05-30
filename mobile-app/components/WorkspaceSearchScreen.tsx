import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
  location: string;
  mimeType: string;
  tags: string[];
  updatedAt: string;
}

interface Props {
  theme?: 'light' | 'dark';
  userId?: string;
  onDocumentSelect?: (docId: string, location?: string) => void;
}

const WorkspaceSearchScreen: React.FC<Props> = ({ 
  theme = 'light', 
  userId,
  onDocumentSelect 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim() && userId) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, userId]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://docuthinker-app-backend-api.vercel.app/v1/search/semantic',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            query: searchQuery,
            topK: 10,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (onDocumentSelect) {
      onDocumentSelect(result.docId, result.location);
    } else {
      // Fallback: try to open in web browser
      const webUrl = `https://docuthinker-ai-app.vercel.app/documents?doc=${result.docId}&location=${result.location}`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Info', `Document: ${result.title}\nLocation: ${result.location}`);
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('text')) return 'document-outline';
    return 'document';
  };

  const formatScore = (score: number) => {
    return `${Math.round((1 - score) * 100)}%`;
  };

  const highlightQuery = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={[styles.highlight, isDark && styles.highlightDark]}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={[styles.resultItem, isDark && styles.resultItemDark]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <View style={styles.titleRow}>
          <Ionicons 
            name={getFileIcon(item.mimeType) as any}
            size={18} 
            color={isDark ? '#4A9EFF' : '#1976d2'} 
          />
          <Text style={[styles.resultTitle, isDark && styles.textDark]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, isDark && styles.scoreDark]}>
              {formatScore(item.score)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.resultSnippet, isDark && styles.textSecondaryDark]} numberOfLines={3}>
        {highlightQuery(item.snippet, query)}
      </Text>

      <View style={styles.resultFooter}>
        {item.tags.map((tag) => (
          <View key={tag} style={[styles.tag, isDark && styles.tagDark]}>
            <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{tag}</Text>
          </View>
        ))}
        
        <Text style={[styles.location, isDark && styles.textSecondaryDark]}>
          📍 {item.location}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="search" 
        size={64} 
        color={isDark ? '#555' : '#ccc'} 
      />
      <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
        {query ? 'No results found' : 'Search across all your documents'}
      </Text>
      {!query && (
        <Text style={[styles.emptySubtext, isDark && styles.textSecondaryDark]}>
          Try searching for keywords, topics, or specific content
        </Text>
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons 
        name="alert-circle" 
        size={48} 
        color="#ff6b6b" 
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => performSearch(query)}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, isDark && styles.searchHeaderDark]}>
        <View style={[styles.searchInputContainer, isDark && styles.searchInputContainerDark]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isDark ? '#aaa' : '#666'} 
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search your workspace..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {loading && (
            <ActivityIndicator size="small" color={isDark ? '#4A9EFF' : '#1976d2'} />
          )}
        </View>
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.docId}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={error ? renderError() : renderEmptyState()}
      />

      {/* Results Count */}
      {results.length > 0 && (
        <View style={[styles.resultsFooter, isDark && styles.resultsFooterDark]}>
          <Text style={[styles.resultsCount, isDark && styles.textSecondaryDark]}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  searchHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  searchHeaderDark: {
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainerDark: {
    backgroundColor: '#333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  searchInputDark: {
    color: '#fff',
  },
  resultsContainer: {
    padding: 16,
    flexGrow: 1,
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItemDark: {
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
  },
  resultHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginLeft: 8,
  },
  textDark: {
    color: '#fff',
  },
  scoreContainer: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  score: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  scoreDark: {
    color: '#4A9EFF',
  },
  resultSnippet: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  textSecondaryDark: {
    color: '#ccc',
  },
  highlight: {
    backgroundColor: '#ffeb3b',
    fontWeight: '600',
  },
  highlightDark: {
    backgroundColor: '#ffc107',
    color: '#000',
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagDark: {
    backgroundColor: '#444',
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  tagTextDark: {
    color: '#ccc',
  },
  location: {
    fontSize: 12,
    color: '#888',
    marginLeft: 'auto',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#4A9EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  resultsFooterDark: {
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default WorkspaceSearchScreen;