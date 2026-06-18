import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Button,
  useMediaQuery, useTheme, LinearProgress, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, TextField,
} from '@mui/material';
import {
  CalendarMonth, Groups, CheckCircle, Schedule, Save, People,
  EventBusy, Check, Close,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const TrainerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<number, { status: string; comment: string }>>({});

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const trainerId = profile?.trainerId;

  const today = new Date().toISOString().split('T')[0];

  const { data: todayLessons } = useQuery({
    queryKey: ['todayLessons', trainerId, today],
    queryFn: async () => { const res = await api.get('/lessons', { params: { date: today, trainerId } }); return res.data; },
    enabled: !!trainerId,
  });

  const { data: myGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => { const res = await api.get('/groups'); return res.data; },
  });

  const myGroupsList = (myGroups || []).filter((g: any) => g.trainer?.id === trainerId);

  const { data: attendance } = useQuery({
    queryKey: ['attendance', selectedLessonId],
    queryFn: async () => { if (!selectedLessonId) return null; const res = await api.get(`/attendance/lesson/${selectedLessonId}`); return res.data; },
    enabled: !!selectedLessonId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLessonId || !attendance) return;
      const items = attendance.items.map((item: any) => ({
        clientId: item.clientId,
        status: attendanceData[item.clientId]?.status || item.status || 'ABSENT',
        comment: attendanceData[item.clientId]?.comment || item.comment || '',
      }));
      await api.post(`/attendance/lesson/${selectedLessonId}`, { items });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Посещаемость сохранена'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const handleStatusChange = (clientId: number, status: string) => {
    setAttendanceData(prev => ({ ...prev, [clientId]: { ...prev[clientId], status, comment: prev[clientId]?.comment || '' } }));
  };

  const handleCommentChange = (clientId: number, comment: string) => {
    setAttendanceData(prev => ({ ...prev, [clientId]: { ...prev[clientId], comment, status: prev[clientId]?.status || 'PRESENT' } }));
  };

  const completedLessons = (todayLessons || []).filter((l: any) => l.status === 'COMPLETED').length;
  const totalMembers = myGroupsList.reduce((sum: number, g: any) => sum + (g.membersCount || 0), 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Панель тренера
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Добро пожаловать, {profile?.fullName}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#E9D8FD', color: '#6B46C1', width: 56, height: 56, mx: 'auto', mb: 1 }}>
                <CalendarMonth />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>{todayLessons?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Занятий сегодня</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#BEE3F8', color: '#3182CE', width: 56, height: 56, mx: 'auto', mb: 1 }}>
                <Groups />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>{myGroupsList.length}</Typography>
              <Typography variant="body2" color="text.secondary">Мои группы</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#C6F6D5', color: '#38A169', width: 56, height: 56, mx: 'auto', mb: 1 }}>
                <People />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>{totalMembers}</Typography>
              <Typography variant="body2" color="text.secondary">Учеников</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#FEFCBF', color: '#D69E2E', width: 56, height: 56, mx: 'auto', mb: 1 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>{completedLessons}</Typography>
              <Typography variant="body2" color="text.secondary">Проведено сегодня</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Мои занятия сегодня</Typography>
              {(todayLessons || []).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>Нет занятий на сегодня</Typography>
              ) : (
                (todayLessons || []).map((lesson: any) => (
                  <Card
                    key={lesson.id}
                    variant="outlined"
                    sx={{
                      mb: 1.5, cursor: 'pointer',
                      borderLeft: 4,
                      borderColor: selectedLessonId === lesson.id ? 'primary.main' : lesson.status === 'IN_PROGRESS' ? 'success.main' : 'divider',
                      backgroundColor: selectedLessonId === lesson.id ? '#F5F3FF' : 'transparent',
                    }}
                    onClick={() => { setSelectedLessonId(lesson.id); setAttendanceData({}); }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={700} color="primary">
                              {lesson.startTime} – {lesson.endTime}
                            </Typography>
                            <Chip
                              label={lesson.status === 'IN_PROGRESS' ? 'Идет' : lesson.status === 'COMPLETED' ? 'Завершено' : 'Запланировано'}
                              color={lesson.status === 'IN_PROGRESS' ? 'success' : lesson.status === 'COMPLETED' ? 'default' : 'primary'}
                              size="small"
                            />
                          </Box>
                          <Typography fontWeight={600}>{lesson.group?.danceStyle}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Группа: {lesson.group?.name} • Зал: {lesson.room}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {lesson.group?.maxMembers} мест
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Мои группы</Typography>
              {myGroupsList.map((group: any) => (
                <Card key={group.id} variant="outlined" sx={{ mb: 1.5 }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography fontWeight={600}>{group.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{group.danceStyle}</Typography>
                      </Box>
                      <Chip label={`${group.membersCount}/${group.maxMembers}`} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/schedule')}>
                Посмотреть расписание
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {selectedLessonId && attendance && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Посещаемость: {attendance.lesson?.group}
              </Typography>
              <Button variant="contained" startIcon={<Save />} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                Сохранить
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {attendance.lesson?.startTime} – {attendance.lesson?.endTime} • Зал: {attendance.lesson?.room}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`Всего: ${attendance.totalMembers}`} />
              <Chip label={`Присутствуют: ${attendance.present}`} color="success" variant="outlined" />
              <Chip label={`Отсутствуют: ${attendance.absent}`} color="error" variant="outlined" />
            </Box>

            {isMobile ? (
              attendance.items.map((item: any) => (
                <Card key={item.clientId} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight={600} fontSize="0.9rem">{item.fullName}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Присутствует">
                          <IconButton
                            size="small"
                            color={attendanceData[item.clientId]?.status === 'PRESENT' || (!attendanceData[item.clientId] && item.status === 'PRESENT') ? 'success' : 'default'}
                            onClick={() => handleStatusChange(item.clientId, 'PRESENT')}
                          ><Check /></IconButton>
                        </Tooltip>
                        <Tooltip title="Отсутствует">
                          <IconButton
                            size="small"
                            color={attendanceData[item.clientId]?.status === 'ABSENT' || (!attendanceData[item.clientId] && item.status === 'ABSENT') ? 'error' : 'default'}
                            onClick={() => handleStatusChange(item.clientId, 'ABSENT')}
                          ><Close /></IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}>№</TableCell>
                      <TableCell>Клиент</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Комментарий</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.items.map((item: any) => (
                      <TableRow key={item.clientId}>
                        <TableCell>{item.number}</TableCell>
                        <TableCell><Typography fontWeight={600} fontSize="0.875rem">{item.fullName}</Typography></TableCell>
                        <TableCell>
                          <Select
                            value={attendanceData[item.clientId]?.status || item.status || ''}
                            onChange={(e) => handleStatusChange(item.clientId, e.target.value)}
                            size="small"
                            sx={{ minWidth: 140 }}
                          >
                            <MenuItem value="PRESENT">Присутствует</MenuItem>
                            <MenuItem value="ABSENT">Отсутствует</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={attendanceData[item.clientId]?.comment || item.comment || ''}
                            onChange={(e) => handleCommentChange(item.clientId, e.target.value)}
                            placeholder="Комментарий..."
                            sx={{ minWidth: 180 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
