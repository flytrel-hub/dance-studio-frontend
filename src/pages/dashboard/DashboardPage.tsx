import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  People,
  Groups,
  CalendarMonth,
  Payment,
  TrendingUp,
  ArrowUpward,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { InitialsAvatar } from '../../components/InitialsAvatar';

const StatCard = ({ title, value, subtitle, icon, color, change }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                +{change} за неделю
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    },
  });

  const { data: weeklyAttendance } = useQuery({
    queryKey: ['reports', 'attendance', 'groups'],
    queryFn: async () => { const res = await api.get('/reports/attendance/groups'); return res.data; },
  });

  const attendanceData = (weeklyAttendance || []).slice(0, 7).map((item: any, index: number) => ({
    day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index] || item.name,
    percentage: item.percentage || 0,
  }));

  if (isLoading) {
    return <Typography>Загрузка...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Панель администратора
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Всего клиентов"
            value={stats?.totalClients || 0}
            subtitle={`+${stats?.clientsChange || 0} за неделю`}
            icon={<People />}
            color="#E9D8FD"
            change={stats?.clientsChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Активные группы"
            value={stats?.activeGroups || 0}
            subtitle="Активных групп"
            icon={<Groups />}
            color="#BEE3F8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Занятия сегодня"
            value={stats?.todayLessons || 0}
            subtitle="Запланировано"
            icon={<CalendarMonth />}
            color="#C6F6D5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Оплаты за месяц"
            value={`${(stats?.monthPayments || 0).toLocaleString()} ₽`}
            subtitle={`+${stats?.paymentsChange || 0}% к прошлому месяцу`}
            icon={<Payment />}
            color="#FEFCBF"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Ближайшие занятия
              </Typography>
              <List>
                {(stats?.todayLessonsList || []).slice(0, 5).map((lesson: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <InitialsAvatar
                        name={lesson.group?.name || ''}
                        size={40}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${lesson.startTime} – ${lesson.endTime}`}
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography variant="body2" fontWeight={600} component="span" display="block">
                            {lesson.group?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            Зал {lesson.room} • {lesson.trainer?.fullName}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={lesson.status === 'IN_PROGRESS' ? 'Идет' : 'Скоро'}
                      size="small"
                      color={lesson.status === 'IN_PROGRESS' ? 'success' : 'default'}
                    />
                  </ListItem>
                ))}
                {(!stats?.todayLessonsList || stats.todayLessonsList.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Нет запланированных занятий
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Посещаемость (за неделю)
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#6B46C1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Последние платежи
              </Typography>
              <List>
                {(stats?.recentPayments || []).map((payment: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <InitialsAvatar
                        name={payment.client?.fullName || ''}
                        size={40}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={payment.client?.fullName}
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {payment.subscription?.type
                              ? (payment.subscription.type === 'UNLIMITED' ? 'Абонемент «Безлимитный»' : `Абонемент «${payment.subscription.type}»`)
                              : payment.paymentMethod || 'Разовое посещение'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {payment.amount.toLocaleString()} ₽
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(payment.paymentDate).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
                {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Нет платежей
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
