import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, TextField, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar, Chip, Grid, Select,
  MenuItem, InputLabel, FormControl, useMediaQuery, useTheme, Autocomplete,
  ListSubheader, InputAdornment, CircularProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, Groups as GroupsIcon, PersonAdd, PersonRemove,
  Search, Clear,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const groupSchema = z.object({
  name: z.string().min(2, 'Название минимум 2 символа').max(50),
  danceStyle: z.string().min(2, 'Введите направление').max(50),
  trainerId: z.number().min(1, 'Выберите тренера'),
  maxMembers: z.number().min(2, 'Минимум 2 участника').max(50, 'Максимум 50 участников'),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface Client {
  id: number;
  fullName: string;
  phone: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
  danceStyle: string;
  trainer: { id: number; fullName: string; specialization: string };
  maxMembers: number;
  membersCount: number;
  members: Client[];
}

export const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { maxMembers: 15 },
  });

  const isTrainer = user?.role === 'TRAINER';

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups', isTrainer ? user?.id : null],
    queryFn: async () => {
      const params = isTrainer ? `?trainerId=${user?.id}` : '';
      const res = await api.get(`/groups${params}`);
      return res.data;
    },
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => { const res = await api.get('/trainers'); return res.data; },
    enabled: !isTrainer,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['clients-search', clientSearch],
    queryFn: async () => {
      if (!clientSearch || clientSearch.length < 2) return [];
      const res = await api.get(`/clients?search=${encodeURIComponent(clientSearch)}&limit=20`);
      return res.data.items || [];
    },
    enabled: clientSearch.length >= 2,
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

  const addMembersMutation = useMutation({
    mutationFn: async ({ groupId, clientIds }: { groupId: number; clientIds: number[] }) => {
      await api.post(`/groups/${groupId}/members`, { clientIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Участники добавлены');
      setSelectedClients([]);
      setClientSearch('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, clientId }: { groupId: number; clientId: number }) => {
      await api.delete(`/groups/${groupId}/members/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Участник удалён из группы');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
    reset({ name: '', danceStyle: '', trainerId: isTrainer ? (user as any)?.trainerId : 0, maxMembers: 15 });
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setDialogOpen(true);
    setTimeout(() => {
      reset({ name: group.name, danceStyle: group.danceStyle, trainerId: group.trainer.id, maxMembers: group.maxMembers });
    }, 0);
  };

  const handleOpenMembers = (group: Group) => {
    setSelectedGroup(group);
    setSelectedClients([]);
    setClientSearch('');
    setMembersDialogOpen(true);
  };

  const onSubmit = (data: GroupFormData) => {
    editingGroup ? updateMutation.mutate({ id: editingGroup.id, data }) : createMutation.mutate(data);
  };

  const handleAddMembers = () => {
    if (!selectedGroup || selectedClients.length === 0) return;
    addMembersMutation.mutate({
      groupId: selectedGroup.id,
      clientIds: selectedClients.map(c => c.id),
    });
  };

  const handleRemoveMember = (clientId: number) => {
    if (!selectedGroup) return;
    removeMemberMutation.mutate({ groupId: selectedGroup.id, clientId });
  };

  const handleSearchChange = useCallback((value: string) => {
    setClientSearch(value);
  }, []);

  const availableClients = (searchResults || []).filter(
    (c: Client) => !selectedGroup?.members?.some(m => m.id === c.id) && !selectedClients.some(sc => sc.id === c.id)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {isTrainer ? 'Мои группы' : 'Группы'}
        </Typography>
        {!isTrainer && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingGroup(null); setDialogOpen(true); }}>
            Создать группу
          </Button>
        )}
      </Box>

      {groupsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (groups || []).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            {isTrainer ? 'У вас нет групп' : 'Нет групп'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {(groups || []).map((group: Group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card sx={{ height: '100%' }}>
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
                      {!isTrainer && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenEdit(group)}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setDeletingGroup(group); setDeleteDialogOpen(true); }}><Delete fontSize="small" color="error" /></IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Тренер: {group.trainer?.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Участники: {group.membersCount} / {group.maxMembers}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(group.members || []).slice(0, 5).map((m: Client) => (
                        <Chip key={m.id} label={m.fullName} size="small" variant="outlined" />
                      ))}
                      {(group.members || []).length > 5 && (
                        <Chip label={`+${group.members.length - 5}`} size="small" />
                      )}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<PersonAdd />}
                    sx={{ mt: 2 }}
                    onClick={() => handleOpenMembers(group)}
                  >
                    Управление участниками
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Group Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Редактировать группу' : 'Создать группу'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <TextField fullWidth label="Название" {...register('name')} error={!!errors.name} helperText={errors.name?.message} margin="normal" />
            <TextField fullWidth label="Направление танца" {...register('danceStyle')} error={!!errors.danceStyle} helperText={errors.danceStyle?.message} margin="normal" />
            {!isTrainer && (
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
            )}
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

      {/* Delete Group Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить группу?</DialogTitle>
        <DialogContent><Typography>Вы уверены, что хотите удалить {deletingGroup?.name}?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button color="error" onClick={() => deletingGroup && deleteMutation.mutate(deletingGroup.id)}>Удалить</Button>
        </DialogActions>
      </Dialog>

      {/* Members Management Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupsIcon />
            Участники: {selectedGroup?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Search and add clients */}
          <Box sx={{ mb: 3 }}>
            <Autocomplete
              freeSolo
              options={availableClients}
              getOptionLabel={(option: any) => option.fullName || option}
              onInputChange={(_, value) => handleSearchChange(value)}
              onChange={(_, value) => {
                if (value && typeof value === 'object') {
                  setSelectedClients(prev => [...prev, value as Client]);
                  setClientSearch('');
                }
              }}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Найти клиента по имени"
                  placeholder="Введите имя..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searchLoading && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  fullWidth
                />
              )}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.phone} | {option.email}</Typography>
                  </Box>
                </li>
              )}
            />
          </Box>

          {/* Selected to add */}
          {selectedClients.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Будут добавлены:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {selectedClients.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.fullName}
                    onDelete={() => setSelectedClients(prev => prev.filter(sc => sc.id !== c.id))}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAdd />}
                onClick={handleAddMembers}
                disabled={addMembersMutation.isPending}
                sx={{ mt: 1 }}
              >
                {addMembersMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </Box>
          )}

          {/* Current members */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Текущие участники ({selectedGroup?.members?.length || 0} / {selectedGroup?.maxMembers}):
            </Typography>
            {selectedGroup?.members && selectedGroup.members.length > 0 ? (
              <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>
                {selectedGroup.members.map((member) => (
                  <Chip
                    key={member.id}
                    label={member.fullName}
                    onDelete={() => handleRemoveMember(member.id)}
                    deleteIcon={<PersonRemove />}
                    sx={{ m: 0.25 }}
                  />
                ))}
              </ListSubheader>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Группа пуста
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
