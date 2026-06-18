import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, TextField, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme,
  Grid, Divider, Avatar,
} from '@mui/material';
import {
  Add, Delete, Pause, PlayArrow, Search, CardMembership,
  CheckCircle, Schedule, Star, Check, Close,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const subscriptionSchema = z.object({
  clientId: z.number().min(1, 'Выберите клиента'),
  type: z.enum(['FOUR_LESSONS', 'EIGHT_LESSONS', 'TWELVE_LESSONS', 'UNLIMITED'], { message: 'Выберите тип абонемента' }),
  startDate: z.string().min(1, 'Выберите дату начала'),
  endDate: z.string().min(1, 'Выберите дату окончания'),
  price: z.number().min(100, 'Минимальная стоимость 100 ₽').max(100000, 'Максимальная стоимость 100 000 ₽'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const typeLabels: Record<string, string> = {
  FOUR_LESSONS: '4 занятия',
  EIGHT_LESSONS: '8 занятий',
  TWELVE_LESSONS: '12 занятий',
  UNLIMITED: 'Безлимитный',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  ACTIVE: 'Активен',
  FROZEN: 'Заморожен',
  EXPIRED: 'Истек',
  COMPLETED: 'Завершен',
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  PENDING: 'info',
  ACTIVE: 'success',
  FROZEN: 'warning',
  EXPIRED: 'error',
  COMPLETED: 'default',
};

const PLANS = [
  { type: 'FOUR_LESSONS', label: '4 занятия', price: 4800, lessons: 4, icon: <Schedule />, color: '#E9D8FD', popular: false },
  { type: 'EIGHT_LESSONS', label: '8 занятий', price: 8400, lessons: 8, icon: <CardMembership />, color: '#BEE3F8', popular: false },
  { type: 'TWELVE_LESSONS', label: '12 занятий', price: 11400, lessons: 12, icon: <Star />, color: '#C6F6D5', popular: true },
  { type: 'UNLIMITED', label: 'Безлимитный', price: 15900, lessons: 999, icon: <CheckCircle />, color: '#FEFCBF', popular: false },
];

const ClientSubscriptionsView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const clientId = profile?.clientId;

  const { data: mySubscriptions } = useQuery({
    queryKey: ['mySubscriptions', clientId],
    queryFn: async () => {
      const res = await api.get('/subscriptions', { params: { clientId } });
      return res.data;
    },
    enabled: !!clientId,
  });

  const activeSub = (mySubscriptions || []).find((s: any) => s.status === 'ACTIVE');
  const historySubs = (mySubscriptions || []).filter((s: any) => s.status !== 'ACTIVE');

  const requestMutation = useMutation({
    mutationFn: async (data: { type: string; price: number }) => {
      const res = await api.post('/subscriptions/request', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] });
    },
  });

  const handleRequest = async () => {
    if (!selectedPlan) return;
    try {
      const result = await requestMutation.mutateAsync({ type: selectedPlan.type, price: selectedPlan.price });
      toast.success('Заявка отправлена! Ожидайте одобрения администратора.');
      setRequestDialogOpen(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка отправки заявки');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Мои абонементы</Typography>

      {activeSub ? (
        <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'success.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Абонемент</Typography>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {typeLabels[activeSub.type]}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                  <Chip label={statusLabels[activeSub.status]} color={statusColors[activeSub.status]} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Действует до: <strong>{new Date(activeSub.endDate).toLocaleDateString('ru-RU')}</strong>
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Осталось посещений: <strong>{activeSub.type === 'UNLIMITED' ? '— (безлимитно)' : activeSub.lessonsLeft}</strong>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {activeSub.price.toLocaleString()} ₽
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(activeSub.startDate).toLocaleDateString('ru-RU')} – {new Date(activeSub.endDate).toLocaleDateString('ru-RU')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'warning.main', backgroundColor: '#FFFBEB' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Нет активного абонемента</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Выберите подходящий абонемент ниже или обратитесь к администратору.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Доступные абонементы</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {PLANS.map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan.type}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedPlan?.type === plan.type ? 2 : 1,
                borderColor: selectedPlan?.type === plan.type ? 'primary.main' : 'divider',
                position: 'relative',
                '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
              }}
              onClick={() => { setSelectedPlan(plan); setRequestDialogOpen(true); }}
            >
              {plan.popular && (
                <Chip
                  label="Популярный"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
              )}
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: plan.color, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  {plan.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={600} gutterBottom>{plan.label}</Typography>
                <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                  {plan.price.toLocaleString()} ₽
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {plan.lessons === 999 ? 'Без ограничений' : `${plan.lessons} ${plan.lessons === 4 ? 'занятия' : 'занятий'}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {historySubs.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>История абонементов</Typography>
          {historySubs.map((sub: any) => (
            <Card key={sub.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography fontWeight={600}>{typeLabels[sub.type]}</Typography>
                    <Chip label={statusLabels[sub.status]} color={statusColors[sub.status]} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(sub.startDate).toLocaleDateString('ru-RU')} – {new Date(sub.endDate).toLocaleDateString('ru-RU')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Запросить абонемент</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box sx={{ pt: 1 }}>
              <Card variant="outlined" sx={{ mb: 2, backgroundColor: '#F7FAFC' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={600}>{selectedPlan.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPlan.lessons === 999 ? 'Без ограничений' : `${selectedPlan.lessons} посещений`}
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {selectedPlan.price.toLocaleString()} ₽
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ваша заявка будет передана администратору. После подтверждения вам необходимо будет оплатить абонемент в студии.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleRequest}>Отправить заявку</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const AdminSubscriptionsView: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { clientId: 0, type: 'FOUR_LESSONS' as SubscriptionFormData['type'], startDate: '', endDate: '', price: 0 },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => { const res = await api.get('/subscriptions'); return res.data; },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => { const res = await api.get('/clients', { params: { limit: 200 } }); return res.data?.items || []; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => { const res = await api.post('/subscriptions', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Абонемент создан'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const freezeMutation = useMutation({
    mutationFn: async (id: number) => { await api.post(`/subscriptions/${id}/freeze`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Абонемент заморожен'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка заморозки'),
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (id: number) => { await api.post(`/subscriptions/${id}/unfreeze`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Абонемент разморожен'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка разморозки'),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);
      const res = await api.post(`/subscriptions/${id}/approve`, {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Абонемент одобрен'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => { await api.post(`/subscriptions/${id}/reject`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Заявка отклонена'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/subscriptions/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success('Абонемент удален'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка удаления'),
  });

  const handleCloseDialog = () => { setDialogOpen(false); reset(); };
  const onSubmit = (data: SubscriptionFormData) => { createMutation.mutate(data); };

  const filtered = (subscriptions || []).filter((s: any) => {
    const matchesSearch = !search || s.client?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Абонементы</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Создать абонемент
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Поиск по имени клиента..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Статус</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Статус">
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="PENDING">Ожидает</MenuItem>
                <MenuItem value="ACTIVE">Активен</MenuItem>
                <MenuItem value="FROZEN">Заморожен</MenuItem>
                <MenuItem value="EXPIRED">Истек</MenuItem>
                <MenuItem value="COMPLETED">Завершен</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {isMobile ? (
            <Box>
              {filtered.map((sub: any) => (
                <Card key={sub.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography fontWeight={600}>{sub.client?.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{typeLabels[sub.type] || sub.type}</Typography>
                        <Chip label={statusLabels[sub.status] || sub.status} color={statusColors[sub.status]} size="small" sx={{ mt: 0.5 }} />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Остаток: {sub.type === 'UNLIMITED' ? '∞' : sub.lessonsLeft} занятий
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sub.startDate).toLocaleDateString('ru-RU')} – {new Date(sub.endDate).toLocaleDateString('ru-RU')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography fontWeight={700} color="primary">{sub.price.toLocaleString()} ₽</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {sub.status === 'PENDING' && (
                            <>
                              <IconButton size="small" onClick={() => approveMutation.mutate(sub.id)} title="Одобрить" color="success"><Check fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => rejectMutation.mutate(sub.id)} title="Отклонить" color="error"><Close fontSize="small" /></IconButton>
                            </>
                          )}
                          {sub.status === 'ACTIVE' && (
                            <IconButton size="small" onClick={() => freezeMutation.mutate(sub.id)} title="Заморозить"><Pause fontSize="small" /></IconButton>
                          )}
                          {sub.status === 'FROZEN' && (
                            <IconButton size="small" onClick={() => unfreezeMutation.mutate(sub.id)} title="Разморозить"><PlayArrow fontSize="small" /></IconButton>
                          )}
                          <IconButton size="small" onClick={() => deleteMutation.mutate(sub.id)}><Delete fontSize="small" color="error" /></IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Остаток</TableCell>
                    <TableCell>Период</TableCell>
                    <TableCell>Стоимость</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell><Typography fontWeight={600}>{sub.client?.fullName}</Typography></TableCell>
                      <TableCell>{typeLabels[sub.type] || sub.type}</TableCell>
                      <TableCell><Chip label={statusLabels[sub.status] || sub.status} color={statusColors[sub.status]} size="small" /></TableCell>
                      <TableCell>{sub.type === 'UNLIMITED' ? '∞' : sub.lessonsLeft}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(sub.startDate).toLocaleDateString('ru-RU')} – {new Date(sub.endDate).toLocaleDateString('ru-RU')}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography fontWeight={600}>{sub.price.toLocaleString()} ₽</Typography></TableCell>
                      <TableCell align="right">
                        {sub.status === 'PENDING' && (
                          <>
                            <IconButton size="small" onClick={() => approveMutation.mutate(sub.id)} title="Одобрить" color="success"><Check fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => rejectMutation.mutate(sub.id)} title="Отклонить" color="error"><Close fontSize="small" /></IconButton>
                          </>
                        )}
                        {sub.status === 'ACTIVE' && (
                          <IconButton size="small" onClick={() => freezeMutation.mutate(sub.id)} title="Заморозить"><Pause fontSize="small" /></IconButton>
                        )}
                        {sub.status === 'FROZEN' && (
                          <IconButton size="small" onClick={() => unfreezeMutation.mutate(sub.id)} title="Разморозить"><PlayArrow fontSize="small" /></IconButton>
                        )}
                        <IconButton size="small" onClick={() => deleteMutation.mutate(sub.id)}><Delete fontSize="small" color="error" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Создать абонемент</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal" error={!!errors.clientId}>
              <InputLabel>Клиент</InputLabel>
              <Select
                value={watch('clientId') || ''}
                onChange={(e) => setValue('clientId', Number(e.target.value), { shouldValidate: true })}
                label="Клиент"
              >
                {(clients || []).map((c: any) => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
              </Select>
              {errors.clientId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.clientId.message}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="normal" error={!!errors.type}>
              <InputLabel>Тип абонемента</InputLabel>
              <Select
                value={watch('type') || ''}
                onChange={(e) => setValue('type', e.target.value as SubscriptionFormData['type'], { shouldValidate: true })}
                label="Тип абонемента"
              >
                {PLANS.map((p) => <MenuItem key={p.type} value={p.type}>{p.label} — {p.price.toLocaleString()} ₽</MenuItem>)}
              </Select>
              {errors.type && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.type.message}</Typography>}
            </FormControl>
            <TextField fullWidth label="Дата начала" type="date" {...register('startDate')} margin="normal" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Дата окончания" type="date" {...register('endDate')} margin="normal" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Стоимость (₽)" type="number" {...register('price', { valueAsNumber: true })} margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTrainer = user?.role === 'TRAINER';

  if (isTrainer) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Абонементы</Typography>
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              Просмотр абонементов доступен только администраторам и клиентам.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return isAdmin ? <AdminSubscriptionsView /> : <ClientSubscriptionsView />;
};
