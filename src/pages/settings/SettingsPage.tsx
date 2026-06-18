import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Divider,
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const SettingsPage: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || oldPassword.length < 4) {
      toast.error('Введите текущий пароль');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('Новый пароль должен отличаться от текущего');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      toast.success('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Настройки
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Lock color="primary" />
            <Typography variant="h6" fontWeight={600}>Смена пароля</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <TextField
            fullWidth
            label="Текущий пароль"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Подтвердите новый пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleChangePassword}
            disabled={loading || !oldPassword || !newPassword}
            sx={{ mt: 2 }}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
