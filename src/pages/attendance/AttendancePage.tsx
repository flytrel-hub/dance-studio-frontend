import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, TextField, FormControl, InputLabel, Chip,
  Grid, useMediaQuery, useTheme, IconButton,
} from '@mui/material';
import { Save, ChevronLeft, ChevronRight } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER';
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  const [attendanceData, setAttendanceData] = useState<Record<number, { status: string; comment: string }>>({});

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get('/auth/profile'); return res.data; },
  });

  const trainerId = profile?.trainerId;

  const { data: lessons } = useQuery({
    queryKey: ['lessons', selectedDate, trainerId, isTrainer],
    queryFn: async () => {
      const params: any = { date: selectedDate };
      if (isTrainer && trainerId) params.trainerId = trainerId;
      const res = await api.get('/lessons', { params });
      return res.data;
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ['attendance', selectedLesson],
    queryFn: async () => {
      if (!selectedLesson) return null;
      const res = await api.get(`/attendance/lesson/${selectedLesson}`);
      return res.data;
    },
    enabled: !!selectedLesson,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLesson || !attendance) return;
      const items = attendance.items.map((item: any) => ({
        clientId: item.clientId,
        status: attendanceData[item.clientId]?.status || item.status || 'ABSENT',
        comment: attendanceData[item.clientId]?.comment || item.comment || '',
      }));
      await api.post(`/attendance/lesson/${selectedLesson}`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Посещаемость сохранена');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const handleStatusChange = (clientId: number, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [clientId]: { ...prev[clientId], status, comment: prev[clientId]?.comment || '' },
    }));
  };

  const handleCommentChange = (clientId: number, comment: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [clientId]: { ...prev[clientId], comment, status: prev[clientId]?.status || 'PRESENT' },
    }));
  };

  const navigateDate = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const selectedLessonData = (lessons || []).find((l: any) => l.id === selectedLesson);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Учет посещаемости
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateDate(-1)}><ChevronLeft /></IconButton>
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                size="small"
              />
              <IconButton onClick={() => navigateDate(1)}><ChevronRight /></IconButton>
            </Box>

            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Занятие</InputLabel>
              <Select
                value={selectedLesson}
                onChange={(e) => {
                  setSelectedLesson(Number(e.target.value));
                  setAttendanceData({});
                }}
                label="Занятие"
              >
                <MenuItem value={0}>Выберите занятие</MenuItem>
                {(lessons || []).map((l: any) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.group?.danceStyle} ({l.group?.name}) • {l.startTime} – {l.endTime} • {l.trainer?.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => saveMutation.mutate()}
              disabled={!selectedLesson || saveMutation.isPending}
            >
              Сохранить
            </Button>
          </Box>
        </CardContent>
      </Card>

      {selectedLessonData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedLessonData.group?.danceStyle}
                </Typography>
                <Chip label={selectedLessonData.group?.name} size="small" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Дата: {new Date(selectedLessonData.lessonDate).toLocaleDateString('ru-RU')} •
                  Время: {selectedLessonData.startTime} – {selectedLessonData.endTime} •
                  Зал: {selectedLessonData.room} •
                  Тренер: {selectedLessonData.trainer?.fullName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{attendance?.totalMembers || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Всего</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="success.main">{attendance?.present || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Присутствуют</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">{attendance?.absent || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Отсутствуют</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {attendance && (
        <Card>
          <CardContent>
            {isMobile ? (
              <Box>
                {attendance.items.map((item: any) => (
                  <Card key={item.clientId} variant="outlined" sx={{ mb: 1.5 }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography fontWeight={600} fontSize="0.9rem">{item.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">#{item.number}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant={attendanceData[item.clientId]?.status === 'PRESENT' || (!attendanceData[item.clientId] && item.status === 'PRESENT') ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => handleStatusChange(item.clientId, 'PRESENT')}
                          >
                            Присутствует
                          </Button>
                          <Button
                            size="small"
                            variant={attendanceData[item.clientId]?.status === 'ABSENT' || (!attendanceData[item.clientId] && item.status === 'ABSENT') ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => handleStatusChange(item.clientId, 'ABSENT')}
                          >
                            Отсутствует
                          </Button>
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
                      <TableCell width={50}>№</TableCell>
                      <TableCell>Клиент</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Комментарий</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.items.map((item: any) => (
                      <TableRow key={item.clientId}>
                        <TableCell>{item.number}</TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>{item.fullName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attendanceData[item.clientId]?.status || item.status || ''}
                            onChange={(e) => handleStatusChange(item.clientId, e.target.value)}
                            size="small"
                            sx={{ minWidth: 150 }}
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
                            sx={{ minWidth: 200 }}
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
