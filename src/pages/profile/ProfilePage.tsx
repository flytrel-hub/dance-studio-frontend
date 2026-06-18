import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Chip, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Edit, Person, Email, Phone, CalendarMonth, PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { InitialsAvatar } from '../../components/InitialsAvatar';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { fullName: string; phone: string }) => {
      if (profile?.clientId) {
        const res = await api.put(`/clients/${profile.clientId}`, data);
        return res.data;
      } else if (profile?.trainerId) {
        const res = await api.put(`/trainers/${profile.trainerId}`, data);
        return res.data;
      }
      throw new Error('Не удалось определить тип профиля');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Профиль обновлен');
      setEditOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const avatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const res = await api.put('/auth/avatar', { avatarUrl });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Аватар обновлен');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка загрузки аватара'),
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 2 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      avatarMutation.mutate(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditOpen = () => {
    setFormData({ fullName: profile?.fullName || '', phone: profile?.phone || '' });
    setEditOpen(true);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Профиль
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <InitialsAvatar
                  name={profile?.fullName || ''}
                  avatarUrl={profile?.avatarUrl}
                  size={100}
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    position: 'absolute', bottom: 0, right: -8,
                    minWidth: 0, width: 32, height: 32, borderRadius: '50%',
                    p: 0,
                    '&.MuiButton-root': { borderRadius: '50%' },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoCamera sx={{ fontSize: 16 }} />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarUpload}
                />
              </Box>
              <Typography variant="h5" fontWeight={700}>{profile?.fullName}</Typography>
              <Chip
                label={profile?.role === 'ADMIN' ? 'Администратор' : profile?.role === 'TRAINER' ? 'Тренер' : 'Клиент'}
                color="primary"
                sx={{ mt: 1 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Email color="action" />
                  <Typography variant="body2">{profile?.email}</Typography>
                </Box>
                {profile?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone color="action" />
                    <Typography variant="body2">{profile?.phone}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth color="action" />
                  <Typography variant="body2">
                    Зарегистрирован: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Настройки профиля</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Здесь вы можете изменить свои данные и настройки аккаунта.
              </Typography>
              <Button variant="outlined" startIcon={<Edit />} onClick={handleEditOpen}>
                Редактировать профиль
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать профиль</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="ФИО" value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth label="Телефон" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
