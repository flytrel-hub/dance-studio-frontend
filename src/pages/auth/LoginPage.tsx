import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock, PersonAdd } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email');
      return;
    }

    if (!password || password.length < 4) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #4A2882 0%, #6B46C1 40%, #8B5CF6 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 5,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
            <Box component="svg" viewBox="0 0 400 600" sx={{ width: '100%', height: '100%' }}>
              <circle cx="200" cy="200" r="150" fill="white" />
              <circle cx="100" cy="400" r="80" fill="white" />
              <circle cx="350" cy="350" r="60" fill="white" />
            </Box>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                component="img"
                  src="/logo.png"
                sx={{ width: 55, height: 65, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <Box>
                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: 700, letterSpacing: 1 }}>
                  DANCE STUDIO
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 2.5, fontWeight: 500 }}>
                  ТАНЦЕВАЛЬНАЯ СТУДИЯ
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1, mb: 2 }}>
              DANCE STUDIO
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, letterSpacing: 3, mb: 4, fontWeight: 400 }}>
              ТАНЦЕВАЛЬНАЯ СТУДИЯ
            </Typography>
            <Box sx={{ width: 60, height: 3, backgroundColor: 'white', mb: 3, opacity: 0.6 }} />
            <Typography variant="body1" sx={{ opacity: 0.85, fontStyle: 'italic', maxWidth: 280 }}>
              Движение — это жизнь,<br />
              танец — это язык души
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          flex: isMobile ? 1 : 0.7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          backgroundColor: '#FAFBFC',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {isMobile && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  component="img"
                src="/logo.png"
                  sx={{ width: 45, height: 54, objectFit: 'contain' }}
                />
                <Box>
                  <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 700, color: '#4A2882', letterSpacing: 1 }}>
                    DANCE STUDIO
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2, fontWeight: 500 }}>
                    ТАНЦЕВАЛЬНАЯ СТУДИЯ
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Typography variant="h4" fontWeight={700} gutterBottom align="center">
            Вход в систему
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} align="center">
            Введите свои данные для входа
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder="Логин или email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              placeholder="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    color="primary"
                  />
                }
                label={<Typography variant="body2">Запомнить меня</Typography>}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 14px 0 rgba(107, 70, 193, 0.39)',
              }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              или
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/register"
            startIcon={<PersonAdd />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: '#E2E8F0',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(107, 70, 193, 0.04)' },
            }}
          >
            Регистрация
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block', textAlign: 'center' }}>
            © 2025 Dance Studio. Все права защищены.
          </Typography>

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#F7FAFC', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight={600}>
              Тестовые данные:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Email: admin@studio.ru<br />
              Пароль: password123
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
