import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GameHub Payment', () => {
  render(<App />);
  const linkElement = screen.getByText(/GameHub Payment/i);
  expect(linkElement).toBeInTheDocument();
}); 