import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Grid, Select, MenuItem,
  FormControl, InputLabel, TextField, useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup,
  Tooltip, LinearProgress,
} from '@mui/material';
import {
  Add, ChevronLeft, ChevronRight, Edit, Delete, CalendarMonth,
  EventBusy, CheckCircle, Schedule,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const lessonSchema = z.object({
  groupId: z.number().min(1, 'Выберите группу'),
  trainerId: z.number().min(1, 'Выберите тренера'),
  lessonDate: z.string().min(1, 'Выберите дату'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Формат: ЧЧ:ММ'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Формат: ЧЧ:ММ'),
  room: z.string().min(1, 'Введите зал').max(20),
});

type LessonFormData = z.infer<typeof lessonSchema>;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS': return 'success';
    case 'COMPLETED': return 'default';
    case 'CANCELLED': return 'error';
    default: return 'primary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'Запланировано';
    case 'IN_PROGRESS': return 'Идет';
    case 'COMPLETED': return 'Завершено';
    case 'CANCELLED': return 'Отменено';
    default: return status;
  }
};

const danceIcons: Record<string, string> = {
  'Hip-Hop': '🤸',
  'Contemporary': '💃',
  'Stretching': '🧘',
  'Dance Mix': '🕺',
  'Jazz-Funk': '🩰',
};

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [filterGroup, setFilterGroup] = useState<number>(0);
  const [filterTrainer, setFilterTrainer] = useState<number>(0);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const clientId = profile?.clientId;
  const isTrainer = user?.role === 'TRAINER';
  const trainerId = profile?.trainerId;

  const { data: mySubscriptions } = useQuery({
    queryKey: ['mySubscriptions', clientId],
    queryFn: async () => { const res = await api.get('/subscriptions', { params: { clientId } }); return res.data; },
    enabled: !!clientId,
  });

  const hasActiveSubscription = (mySubscriptions || []).some((s: any) => s.status === 'ACTIVE' && s.lessonsLeft > 0);

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay() + 1);
      end.setDate(start.getDate() + 6);
    } else if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', selectedDate, viewMode, filterGroup, filterTrainer, trainerId, isTrainer],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const params: any = { startDate, endDate };
      if (filterGroup) params.groupId = filterGroup;
      if (isTrainer && trainerId) {
        params.trainerId = trainerId;
      } else if (filterTrainer) {
        params.trainerId = filterTrainer;
      }
      const res = await api.get('/lessons/schedule', { params });
      return res.data;
    },
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
    mutationFn: async (data: LessonFormData) => { const res = await api.post('/lessons', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); toast.success('Занятие создано'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await api.put(`/lessons/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); toast.success('Занятие обновлено'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/lessons/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); toast.success('Занятие удалено'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка удаления'),
  });

  const bookMutation = useMutation({
    mutationFn: async (id: number) => { const res = await api.post(`/lessons/${id}/book`); return res.data; },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success(data.message); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка записи'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: number) => { const res = await api.post(`/lessons/${id}/cancel`); return res.data; },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); queryClient.invalidateQueries({ queryKey: ['mySubscriptions'] }); toast.success(data.message); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка отмены'),
  });

  const handleCloseDialog = () => { setDialogOpen(false); setEditingLesson(null); reset(); };

  const handleOpenEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setDialogOpen(true);
    setTimeout(() => {
      reset({
        groupId: lesson.group?.id,
        trainerId: lesson.trainer?.id,
        lessonDate: lesson.lessonDate?.split('T')[0],
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        room: lesson.room,
      });
    }, 0);
  };

  const onSubmit = (data: LessonFormData) => {
    editingLesson ? updateMutation.mutate({ id: editingLesson.id, data }) : createMutation.mutate(data);
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const formatDate = () => {
    return selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isBooked = (lesson: any) => {
    return lesson.attendances?.some((a: any) => a.client?.id === clientId);
  };

  const getAvailableSpots = (lesson: any) => {
    const max = lesson.group?.maxMembers || 0;
    const booked = lesson.attendances?.length || 0;
    return max - booked;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Расписание занятий</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingLesson(null); setDialogOpen(true); }}>
            Добавить занятие
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="day">День</ToggleButton>
              <ToggleButton value="week">Неделя</ToggleButton>
              <ToggleButton value="month">Месяц</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateDate(-1)}><ChevronLeft /></IconButton>
              <Typography fontWeight={600} sx={{ minWidth: 200, textAlign: 'center', textTransform: 'capitalize' }}>{formatDate()}</Typography>
              <IconButton onClick={() => navigateDate(1)}><ChevronRight /></IconButton>
            </Box>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{isTrainer ? 'Мои группы' : 'Все группы'}</InputLabel>
              <Select value={filterGroup} onChange={(e) => setFilterGroup(Number(e.target.value))} label={isTrainer ? 'Мои группы' : 'Все группы'}>
                <MenuItem value={0}>{isTrainer ? 'Все мои группы' : 'Все группы'}</MenuItem>
                {(isTrainer
                  ? (groups || []).filter((g: any) => g.trainer?.id === trainerId)
                  : groups || []
                ).map((g: any) => <MenuItem key={g.id} value={g.id}>{g.name} ({g.danceStyle})</MenuItem>)}
              </Select>
            </FormControl>

            {!isTrainer && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Все тренеры</InputLabel>
                <Select value={filterTrainer} onChange={(e) => setFilterTrainer(Number(e.target.value))} label="Все тренеры">
                  <MenuItem value={0}>Все тренеры</MenuItem>
                  {(trainers || []).map((t: any) => <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        </CardContent>
      </Card>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {!isAdmin && !hasActiveSubscription && (
        <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'warning.main', backgroundColor: '#FFFBEB' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Schedule color="warning" />
            <Box>
              <Typography fontWeight={600}>У вас нет активного абонемента</Typography>
              <Typography variant="body2" color="text.secondary">
                Для записи на занятия необходимо оформить абонемент.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box>
        {(lessons || []).length === 0 && !isLoading ? (
          <Card><CardContent><Typography color="text.secondary" textAlign="center" py={4}>Нет занятий на выбранный период</Typography></CardContent></Card>
        ) : (
          <Grid container spacing={2}>
            {(lessons || []).map((lesson: any) => {
              const available = getAvailableSpots(lesson);
              const booked = isBooked(lesson);
              const icon = danceIcons[lesson.group?.danceStyle] || '💃';

              return (
                <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderLeft: 4,
                      borderLeftColor: lesson.status === 'IN_PROGRESS' ? 'success.main' : 'primary.main',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: 2 },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Typography fontSize="2rem">{icon}</Typography>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight={700} color="primary">
                                {lesson.startTime} – {lesson.endTime}
                              </Typography>
                              <Chip label={getStatusLabel(lesson.status)} color={getStatusColor(lesson.status)} size="small" />
                            </Box>
                            <Typography fontWeight={600}>{lesson.group?.danceStyle}</Typography>
                            <Typography variant="body2" color="text.secondary">Группа: {lesson.group?.name}</Typography>
                            <Typography variant="body2" color="text.secondary">Тренер: {lesson.trainer?.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary">Зал: {lesson.room}</Typography>
                          </Box>
                        </Box>

                        {isAdmin && (
                          <Box>
                            <IconButton size="small" onClick={() => handleOpenEdit(lesson)}><Edit fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => deleteMutation.mutate(lesson.id)}><Delete fontSize="small" color="error" /></IconButton>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" color={available > 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                            {available > 0 ? `${available} мест свободно` : 'Нет мест'}
                          </Typography>
                          <Box sx={{ width: 100, mt: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={((lesson.group?.maxMembers - available) / lesson.group?.maxMembers) * 100}
                              color={available > 3 ? 'success' : available > 0 ? 'warning' : 'error'}
                              sx={{ borderRadius: 1, height: 6 }}
                            />
                          </Box>
                        </Box>

                        {!isAdmin && isTrainer && lesson.status !== 'CANCELLED' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => navigate('/attendance')}
                          >
                            Посещаемость
                          </Button>
                        )}

                        {!isAdmin && !isTrainer && lesson.status === 'SCHEDULED' && (
                          booked ? (
                            <Tooltip title="Отменить запись">
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<EventBusy />}
                                onClick={() => cancelBookingMutation.mutate(lesson.id)}
                                disabled={cancelBookingMutation.isPending}
                              >
                                Отменить
                              </Button>
                            </Tooltip>
                          ) : hasActiveSubscription ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => bookMutation.mutate(lesson.id)}
                              disabled={bookMutation.isPending || available <= 0}
                            >
                              Записаться
                            </Button>
                          ) : (
                            <Tooltip title="Для записи необходим абонемент">
                              <span>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  disabled
                                  startIcon={<Schedule />}
                                >
                                  Записаться
                                </Button>
                              </span>
                            </Tooltip>
                          )
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {isAdmin && (
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingLesson ? 'Редактировать занятие' : 'Добавить занятие'}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal" error={!!errors.groupId}>
                <InputLabel>Группа</InputLabel>
                <Select
                  value={watch('groupId') || ''}
                  onChange={(e) => setValue('groupId', Number(e.target.value), { shouldValidate: true })}
                  label="Группа"
                >
                  {(groups || []).map((g: any) => <MenuItem key={g.id} value={g.id}>{g.name} ({g.danceStyle})</MenuItem>)}
                </Select>
                {errors.groupId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.groupId.message}</Typography>}
              </FormControl>
              <FormControl fullWidth margin="normal" error={!!errors.trainerId}>
                <InputLabel>Тренер</InputLabel>
                <Select
                  value={watch('trainerId') || ''}
                  onChange={(e) => setValue('trainerId', Number(e.target.value), { shouldValidate: true })}
                  label="Тренер"
                >
                  {(trainers || []).map((t: any) => <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>)}
                </Select>
                {errors.trainerId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.trainerId.message}</Typography>}
              </FormControl>
              <TextField fullWidth label="Дата" type="date" {...register('lessonDate')} margin="normal" InputLabelProps={{ shrink: true }} error={!!errors.lessonDate} helperText={errors.lessonDate?.message} />
              <TextField fullWidth label="Время начала" {...register('startTime')} margin="normal" placeholder="10:00" error={!!errors.startTime} helperText={errors.startTime?.message} />
              <TextField fullWidth label="Время окончания" {...register('endTime')} margin="normal" placeholder="11:00" error={!!errors.endTime} helperText={errors.endTime?.message} />
              <TextField fullWidth label="Зал" {...register('room')} margin="normal" error={!!errors.room} helperText={errors.room?.message} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Отмена</Button>
            <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingLesson ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
