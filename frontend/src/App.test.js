import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import Home from './pages/Home';

jest.mock('axios');

describe('Home Component', () => {
  beforeEach(() => {
    axios.post.mockClear();
  });

  it('renders the UploadModal when there is no summary', () => {
    render(<Home theme="light" />);

    expect(screen.getByText(/Upload a Document/i)).toBeInTheDocument();
  });

  it('renders original text and summary correctly', async () => {
    const mockSummary = 'This is the document summary';
    render(<Home theme="light" />);

    fireEvent.click(screen.getByText(/Upload a Document/i));
    fireEvent.click(screen.getByText(/Upload New Document/i));

    await waitFor(() => {
      expect(screen.getByText(mockSummary)).toBeInTheDocument();
    });
  });

  it('handles generate key ideas button click and shows loading spinner', async () => {
    // Mock the Axios response for generating key ideas
    axios.post.mockResolvedValue({
      data: { keyIdeas: 'These are key ideas from the document.' }
    });

    render(<Home theme="light" />);

    // Simulate setting originalText to enable buttons
    fireEvent.click(screen.getByText(/Generate Key Ideas/i));

    // Loading spinner appears when the button is clicked
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the loading spinner to disappear after the API resolves
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Ensure the key ideas are rendered
    expect(screen.getByText(/These are key ideas from the document./i)).toBeInTheDocument();
  });

  it('handles generate discussion points button click and shows loading spinner', async () => {
    // Mock the Axios response for generating discussion points
    axios.post.mockResolvedValue({
      data: { discussionPoints: 'These are the discussion points.' }
    });

    render(<Home theme="light" />);

    // Simulate setting originalText to enable buttons
    fireEvent.click(screen.getByText(/Generate Discussion Points/i));

    // Loading spinner appears when the button is clicked
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the loading spinner to disappear after the API resolves
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Ensure the discussion points are rendered
    expect(screen.getByText(/These are the discussion points./i)).toBeInTheDocument();
  });

  it('displays an error message if the API call for key ideas fails', async () => {
    // Mock a failed Axios request
    axios.post.mockRejectedValue(new Error('Failed to generate key ideas'));

    render(<Home theme="light" />);

    fireEvent.click(screen.getByText(/Generate Key Ideas/i));

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.queryByText(/Failed to generate key ideas/i)).toBeInTheDocument();
  });

  it('reloads the page when "Upload New Document" is clicked', () => {
    // Mock the window.location.reload function
    const reloadMock = jest.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(<Home theme="light" />);

    // Click the upload new document button
    fireEvent.click(screen.getByText(/Upload New Document/i));

    expect(reloadMock).toHaveBeenCalled();

    // Restore the original reload function
    reloadMock.mockRestore();
  });
});
