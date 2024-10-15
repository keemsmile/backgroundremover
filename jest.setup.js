import '@testing-library/jest-dom/extend-expect'

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the window.URL.createObjectURL method
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn();
}

// Suppress console.error for React 18 issues with useEffect in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning: ReactDOM.render is no longer supported in React 18./.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});