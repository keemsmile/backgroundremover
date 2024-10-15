import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BackgroundRemover from '../app/upscaler/page';
import * as fal from '@fal-ai/serverless-client';

// Mock the entire @fal-ai/serverless-client module
jest.mock('@fal-ai/serverless-client', () => ({
  subscribe: jest.fn(),
  config: jest.fn(),
}));

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('BackgroundRemover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component', () => {
    render(<BackgroundRemover />);
    expect(screen.getByText('Image Background Remover')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Remove Background')).toBeInTheDocument();
  });

  it('handles file upload and submission', async () => {
    (fal.subscribe as jest.Mock).mockResolvedValue({
      image: { url: 'https://example.com/processed-image.png' }
    });

    render(<BackgroundRemover />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText('Upload Image');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Remove Background'));

    await waitFor(() => {
      expect(fal.subscribe).toHaveBeenCalled();
      expect(screen.getByAltText('Processed')).toBeInTheDocument();
    });
  });

  it('handles errors during background removal', async () => {
    (fal.subscribe as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<BackgroundRemover />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText('Upload Image');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Remove Background'));

    await waitFor(() => {
      expect(screen.getByText('Remove Background')).toBeInTheDocument();
    });
  });
});