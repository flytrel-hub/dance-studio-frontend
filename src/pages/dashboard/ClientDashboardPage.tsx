import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Button, Divider,
  useMediaQuery, useTheme, IconButton,
} from '@mui/material';
import {
  Edit, CalendarMonth, CardMembership, CheckCircle, Notifications,
  Person, Email, Phone, CalendarToday, ArrowForward, Event, Info, Star,
  CardGiftcard,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { InitialsAvatar } from '../../components/InitialsAvatar';

const typeLabels: Record<string, string> = {
  FOUR_LESSONS: '4 занятия',
  EIGHT_LESSONS: '8 занятий',
  TWELVE_LESSONS: '12 занятий',
  UNLIMITED: 'Безлимитный',
};

export const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const clientId = profile?.clientId;

  const { data: mySubscriptions } = useQuery({
    queryKey: ['mySubscriptions', clientId],
    queryFn: async () => { const res = await api.get('/subscriptions', { params: { clientId } }); return res.data; },
    enabled: !!clientId,
  });

  const { data: myAttendance } = useQuery({
    queryKey: ['myAttendance', clientId],
    queryFn: async () => { const res = await api.get('/attendance', { params: { clientId } }); return res.data; },
    enabled: !!clientId,
  });

  const { data: schedule } = useQuery({
    queryKey: ['todaySchedule'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/lessons', { params: { date: today } });
      return res.data;
    },
  });

  const activeSub = (mySubscriptions || []).find((s: any) => s.status === 'ACTIVE');
  const attendance = myAttendance || [];
  const monthAttendance = attendance.filter((a: any) => {
    const d = new Date(a.lesson?.lessonDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const presentCount = monthAttendance.filter((a: any) => a.status === 'PRESENT').length;
  const recentAttendance = attendance.slice(0, 5);

  const notifications = [
    { icon: <Event color="primary" />, title: 'Изменение в расписании', time: 'Сегодня, 10:00', color: '#E9D8FD' },
    { icon: <Info color="info" />, title: 'Напоминание о занятии', time: 'Сегодня, 09:00', color: '#BEE3F8' },
    { icon: <Star color="warning" />, title: 'Акция: Приведи друга', time: 'Вчера, 18:20', color: '#FEFCBF' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Личный кабинет</Typography>
          <Typography variant="body1" color="text.secondary">
            Добро пожаловать, {profile?.fullName?.split(' ')[0]}!
          </Typography>
        </Box>
        <IconButton color="inherit">
          <Notifications />
        </IconButton>
      </Box>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <InitialsAvatar
                    name={user?.fullName || ''}
                    avatarUrl={profile?.avatarUrl}
                    size={80}
                    sx={{ width: 80, height: 80, fontSize: 32 }}
                  />
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {profile?.fullName}
                  </Typography>
                  <Chip label="Клиент" color="primary" size="small" sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{profile?.phone || 'Не указан'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Дата регистрации: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/profile')}
              >
                Редактировать профиль
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Ближайшее занятие</Typography>
                  {schedule && schedule.length > 0 ? (
                    <>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {schedule[0].group?.danceStyle}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarMonth fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(schedule[0].lessonDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {schedule[0].startTime} – {schedule[0].endTime}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Тренер: {schedule[0].trainer?.fullName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Зал {schedule[0].room}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Нет запланированных занятий</Typography>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: '#FED7E2', color: '#D53F8C', width: 56, height: 56 }}>
                  <CalendarMonth />
                </Avatar>
              </Box>
              <Button
                variant="contained"
                fullWidth
                startIcon={<CalendarMonth />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/schedule')}
              >
                Перейти к расписанию
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Мои абонементы</Typography>
                <CardMembership color="primary" />
              </Box>
              {activeSub ? (
                <Box sx={{ p: 2, backgroundColor: '#F7FAFC', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Абонемент: <strong>{typeLabels[activeSub.type]}</strong></Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">Статус:</Typography>
                    <Chip label="Активен" color="success" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Действует до: <strong>{new Date(activeSub.endDate).toLocaleDateString('ru-RU')}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Осталось посещений: <strong>{activeSub.type === 'UNLIMITED' ? '— (безлимитно)' : activeSub.lessonsLeft}</strong>
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Нет активного абонемента
                </Typography>
              )}
              <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => navigate('/subscriptions')}>
                Подробнее
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>История посещений</Typography>
                <Button size="small" onClick={() => navigate('/attendance')}>Смотреть все</Button>
              </Box>
              {recentAttendance.length > 0 ? (
                recentAttendance.map((att: any, i: number) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: i < recentAttendance.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {att.lesson?.group?.danceStyle || 'Занятие'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(att.lesson?.lessonDate).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                    <Chip
                      label={att.status === 'PRESENT' ? 'Присутствовал' : 'Отсутствовал'}
                      color={att.status === 'PRESENT' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Нет данных о посещениях
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Уведомления</Typography>
                <Button size="small">Смотреть все</Button>
              </Box>
              {notifications.map((notif, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1.5, borderBottom: i < notifications.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                  <Avatar sx={{ bgcolor: notif.color, width: 36, height: 36 }}>
                    {notif.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{notif.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{notif.time}</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)', color: 'white' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <CardGiftcard />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Приведи друга и получи скидку 10%!</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Подробнее об акции в разделе «Акции».
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: '#F7FAFC' } }}
          >
            Подробнее
          </Button>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{presentCount}</Typography>
              <Typography variant="body2" color="text.secondary">Посещений за месяц</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Notifications sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>2</Typography>
              <Typography variant="body2" color="text.secondary">Новых уведомлений</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
