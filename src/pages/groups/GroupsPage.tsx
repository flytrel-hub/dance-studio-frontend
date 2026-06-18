import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, TextField, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar, Chip, Grid, Select,
  MenuItem, InputLabel, FormControl, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Groups as GroupsIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const groupSchema = z.object({
  name: z.string().min(2, 'Название минимум 2 символа').max(50),
  danceStyle: z.string().min(2, 'Введите направление').max(50),
  trainerId: z.number().min(1, 'Выберите тренера'),
  maxMembers: z.number().min(2, 'Минимум 2 участника').max(50, 'Максимум 50 участников'),
});

type GroupFormData = z.infer<typeof groupSchema>;

export const GroupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<any>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { maxMembers: 15 },
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => { const res = await api.get('/groups'); return res.data; },
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => { const res = await api.get('/trainers'); return res.data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GroupFormData) => { const res = await api.post('/groups', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Группа создана'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GroupFormData }) => { const res = await api.put(`/groups/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Группа обновлена'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/groups/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Группа удалена'); setDeleteDialogOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка удаления'),
  });

  const handleCloseDialog = () => { setDialogOpen(false); setEditingGroup(null); reset({ name: '', danceStyle: '', trainerId: 0, maxMembers: 15 }); };

  const handleOpenEdit = (group: any) => {
    setEditingGroup(group);
    setDialogOpen(true);
    setTimeout(() => {
      reset({ name: group.name, danceStyle: group.danceStyle, trainerId: group.trainer.id, maxMembers: group.maxMembers });
    }, 0);
  };

  const onSubmit = (data: GroupFormData) => {
    editingGroup ? updateMutation.mutate({ id: editingGroup.id, data }) : createMutation.mutate(data);
  };

  const getTrainerName = (trainerId: number) => {
    const trainer = (trainers || []).find((t: any) => t.id === trainerId);
    return trainer?.fullName || '';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Группы</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingGroup(null); setDialogOpen(true); }}>
          Создать группу
        </Button>
      </Box>

      <Grid container spacing={2}>
        {(groups || []).map((group: any) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.dark' }}>
                      <GroupsIcon />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{group.name}</Typography>
                      <Chip label={group.danceStyle} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenEdit(group)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setDeletingGroup(group); setDeleteDialogOpen(true); }}><Delete fontSize="small" color="error" /></IconButton>
                  </Box>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Тренер: {group.trainer?.fullName || getTrainerName(group.trainerId)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Участники: {group.membersCount} / {group.maxMembers}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(group.members || []).slice(0, 5).map((m: any, i: number) => (
                      <Chip key={i} label={m.fullName} size="small" variant="outlined" />
                    ))}
                    {(group.members || []).length > 5 && (
                      <Chip label={`+${group.members.length - 5}`} size="small" />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Редактировать группу' : 'Создать группу'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <TextField fullWidth label="Название" {...register('name')} error={!!errors.name} helperText={errors.name?.message} margin="normal" />
            <TextField fullWidth label="Направление танца" {...register('danceStyle')} error={!!errors.danceStyle} helperText={errors.danceStyle?.message} margin="normal" />
            <FormControl fullWidth margin="normal" error={!!errors.trainerId}>
              <InputLabel>Тренер</InputLabel>
              <Select
                value={watch('trainerId') || ''}
                onChange={(e) => setValue('trainerId', Number(e.target.value), { shouldValidate: true })}
                label="Тренер"
              >
                {(trainers || []).map((t: any) => (
                  <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
                ))}
              </Select>
              {errors.trainerId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.trainerId.message}</Typography>}
            </FormControl>
            <TextField fullWidth label="Макс. участников" type="number" {...register('maxMembers', { valueAsNumber: true })} margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending}>
            {editingGroup ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить группу?</DialogTitle>
        <DialogContent><Typography>Вы уверены, что хотите удалить {deletingGroup?.name}?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button color="error" onClick={() => deleteMutation.mutate(deletingGroup?.id)}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
