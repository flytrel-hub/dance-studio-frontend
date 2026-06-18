import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, InputAdornment, useMediaQuery, useTheme, Grid, Chip,
} from '@mui/material';
import { Add, Search, Edit, Delete, FitnessCenter } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { InitialsAvatar } from '../../components/InitialsAvatar';

const trainerSchema = z.object({
  fullName: z.string().min(2, 'ФИО должно содержать минимум 2 символа').max(100),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,18}$/, 'Некорректный номер телефона'),
  email: z.string().email('Некорректный email').max(100),
  specialization: z.string().min(2, 'Введите специализацию').max(100),
  description: z.string().max(500).optional(),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

export const TrainersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTrainer, setDeletingTrainer] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
  });

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const res = await api.get('/trainers');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      const res = await api.post('/trainers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Тренер создан');
      handleCloseDialog();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TrainerFormData }) => {
      const res = await api.put(`/trainers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Тренер обновлен');
      handleCloseDialog();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/trainers/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Тренер удален');
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка удаления'),
  });

  const handleCloseDialog = () => { setDialogOpen(false); setEditingTrainer(null); reset(); };

  const handleOpenEdit = (trainer: any) => {
    setEditingTrainer(trainer);
    setDialogOpen(true);
    setTimeout(() => {
      reset({ fullName: trainer.fullName, phone: trainer.phone, email: trainer.email, specialization: trainer.specialization, description: trainer.description || '' });
    }, 0);
  };

  const onSubmit = (data: TrainerFormData) => {
    editingTrainer ? updateMutation.mutate({ id: editingTrainer.id, data }) : createMutation.mutate(data);
  };

  const filtered = (trainers || []).filter((t: any) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Тренеры</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingTrainer(null); setDialogOpen(true); }}>
          Добавить тренера
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TextField
            fullWidth placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            {filtered.map((trainer: any) => (
              <Grid item xs={12} sm={6} md={4} key={trainer.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <InitialsAvatar name={trainer.fullName || ''} avatarUrl={trainer.avatarUrl} size={40} />
                        <Box>
                          <Typography fontWeight={600}>{trainer.fullName}</Typography>
                          <Chip label={trainer.specialization} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{trainer.phone}</Typography>
                          <Typography variant="body2" color="text.secondary">{trainer.email}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenEdit(trainer)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => { setDeletingTrainer(trainer); setDeleteDialogOpen(true); }}><Delete fontSize="small" color="error" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTrainer ? 'Редактировать тренера' : 'Добавить тренера'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <TextField fullWidth label="ФИО" {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} margin="normal" />
            <TextField fullWidth label="Телефон" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} margin="normal" />
            <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} margin="normal" />
            <TextField fullWidth label="Специализация" {...register('specialization')} error={!!errors.specialization} helperText={errors.specialization?.message} margin="normal" />
            <TextField fullWidth label="Описание" {...register('description')} margin="normal" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending}>
            {editingTrainer ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить тренера?</DialogTitle>
        <DialogContent><Typography>Вы уверены, что хотите удалить {deletingTrainer?.fullName}?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button color="error" onClick={() => deleteMutation.mutate(deletingTrainer?.id)} disabled={deleteMutation.isPending}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
