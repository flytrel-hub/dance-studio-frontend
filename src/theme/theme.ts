import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6B46C1',
      light: '#9F7AEA',
      dark: '#553C9A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD8CE',
      light: '#FFD7D7',
      dark: '#FF9A8B',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    success: {
      main: '#48BB78',
      light: '#C6F6D5',
    },
    error: {
      main: '#FC8181',
      light: '#FED7D7',
    },
    warning: {
      main: '#F6AD55',
      light: '#FEEBC8',
    },
    text: {
      primary: '#1A202C',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#1A202C',
    },
    h5: {
      fontWeight: 700,
      color: '#1A202C',
    },
    h6: {
      fontWeight: 600,
      color: '#1A202C',
    },
    subtitle1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 24px',
        },
        containedPrimary: {
          boxShadow: '0 4px 14px 0 rgba(107, 70, 193, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(107, 70, 193, 0.49)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          color: '#718096',
          backgroundColor: '#F7FAFC',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
