import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Waitlist from '../src/Waitlist';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Waitlist component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  xtest('renders the form with inputs and button', () => {
    render(<Waitlist />);

    const nameInput = screen.getByPlaceholderText('Name');
    const partySizeInput = screen.getByPlaceholderText('Party Size');
    const submitButton = screen.getByText('Join Waitlist');

    expect(nameInput).toBeInTheDocument();
    expect(partySizeInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        customerId: 123,
        position: 5,
      }
    });

    render(<Waitlist />);

    const nameInput = screen.getByPlaceholderText('Name');
    const partySizeInput = screen.getByPlaceholderText('Party Size');
    const submitButton = screen.getByText('Join Waitlist');
    const form = screen.getByTestId('waitlist-form');;

    userEvent.type(nameInput, 'Kelly');
    userEvent.clear(partySizeInput);
    userEvent.type(partySizeInput, '10');
  
    fireEvent.submit(form);

    // screen.debug();

    expect(submitButton).toBeDisabled();

    expect(mockedAxios.post).toHaveBeenCalled();
  });

});
