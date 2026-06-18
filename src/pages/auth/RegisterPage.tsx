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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'ФИО должно содержать минимум 2 символа').max(100, 'Слишком длинное ФИО'),
  email: z.string().email('Некорректный email').max(100),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,18}$/, 'Некорректный номер телефона'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').max(100),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, p: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
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
            <Typography variant="h5" fontWeight={700} color="primary">
              Регистрация
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создайте аккаунт клиента
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="ФИО"
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Телефон"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Подтвердите пароль"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              margin="normal"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Уже есть аккаунт?{' '}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                Войти
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
