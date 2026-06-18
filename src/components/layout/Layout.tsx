import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem,
  useMediaQuery, useTheme, Divider, Badge, Tooltip, Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, FitnessCenter, Groups,
  CalendarMonth, CheckCircle, CardMembership, Payment, Assessment,
  Settings, Logout, Person, ChevronLeft, ChevronRight, MoreVert,
  Home, Notifications, Event, Info, Star, Circle,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { InitialsAvatar } from '../InitialsAvatar';
import api from '../../api/axios';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const BRAND_FONT = '"Playfair Display", serif';

const DanceLogo: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
    <Box
      component="img"
      src="/logo.png"
      alt="Dance Studio"
      sx={{ width: collapsed ? 38 : 46, height: collapsed ? 44 : 54, objectFit: 'contain', flexShrink: 0 }}
    />
    {!collapsed && (
      <Box sx={{ overflow: 'hidden' }}>
        <Typography
          sx={{
            fontFamily: BRAND_FONT,
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#4A2882',
            lineHeight: 1.1,
            letterSpacing: '0.5px',
          }}
        >
          DANCE STUDIO
        </Typography>
        <Typography
          sx={{
            fontSize: '0.55rem',
            color: '#718096',
            letterSpacing: '2.5px',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          ТАНЦЕВАЛЬНАЯ СТУДИЯ
        </Typography>
      </Box>
    )}
  </Box>
);

const adminMenuItems = [
  { text: 'Панель управления', icon: <Dashboard />, path: '/' },
  { text: 'Клиенты', icon: <People />, path: '/clients' },
  { text: 'Тренеры', icon: <FitnessCenter />, path: '/trainers' },
  { text: 'Группы', icon: <Groups />, path: '/groups' },
  { text: 'Расписание', icon: <CalendarMonth />, path: '/schedule' },
  { text: 'Посещаемость', icon: <CheckCircle />, path: '/attendance' },
  { text: 'Абонементы', icon: <CardMembership />, path: '/subscriptions' },
  { text: 'Платежи', icon: <Payment />, path: '/payments' },
  { text: 'Отчеты', icon: <Assessment />, path: '/reports' },
  { text: 'Настройки', icon: <Settings />, path: '/settings' },
];

const trainerMenuItems = [
  { text: 'Главная', icon: <Home />, path: '/' },
  { text: 'Расписание', icon: <CalendarMonth />, path: '/schedule' },
  { text: 'Мои группы', icon: <Groups />, path: '/groups' },
  { text: 'Посещаемость', icon: <CheckCircle />, path: '/attendance' },
  { text: 'Заявки', icon: <Event />, path: '/pending-bookings' },
  { text: 'Профиль', icon: <Person />, path: '/profile' },
];

const clientMenuItems = [
  { text: 'Главная', icon: <Home />, path: '/' },
  { text: 'Расписание', icon: <CalendarMonth />, path: '/schedule' },
  { text: 'Абонементы', icon: <CardMembership />, path: '/subscriptions' },
  { text: 'Посещения', icon: <CheckCircle />, path: '/attendance' },
  { text: 'Профиль', icon: <Person />, path: '/profile' },
];

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems :
    user?.role === 'TRAINER' ? trainerMenuItems : clientMenuItems;

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'subscription_request': return <CardMembership fontSize="small" color="primary" />;
      case 'subscription_approved': return <CheckCircle fontSize="small" color="success" />;
      case 'subscription_rejected': return <Info fontSize="small" color="error" />;
      case 'booking': return <Event fontSize="small" color="info" />;
      case 'booking_cancelled': return <Event fontSize="small" color="warning" />;
      case 'booking_approved': return <CheckCircle fontSize="small" color="success" />;
      case 'booking_rejected': return <Info fontSize="small" color="error" />;
      default: return <Info fontSize="small" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} мин назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (path: string) => { navigate(path); if (isMobile) setMobileOpen(false); };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        p: collapsed ? 1.5 : 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 64,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <DanceLogo collapsed={collapsed} />
      </Box>
      <Divider />

      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1, py: 1 }}>
        {menuItems.map((item) => {
          const button = (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1.5 : 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                <Collapse in={!collapsed} orientation="horizontal" timeout={200}>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                  />
                </Collapse>
              </ListItemButton>
            </ListItem>
          );

          return collapsed ? (
            <Tooltip key={item.path} title={item.text} placement="right" arrow>
              {button}
            </Tooltip>
          ) : button;
        })}
      </List>

      <Divider />

      <Box sx={{
        p: collapsed ? 1 : 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <Tooltip title={collapsed ? `${user?.fullName || ''} (${user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'TRAINER' ? 'Тренер' : 'Клиент'})` : ''} placement="right" arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'default' }}>
            <InitialsAvatar
              name={user?.fullName || ''}
              avatarUrl={(user as any)?.avatarUrl}
              size={36}
              sx={{ flexShrink: 0 }}
            />
            <Collapse in={!collapsed} orientation="horizontal" timeout={200}>
              <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={600} noWrap fontSize="0.8rem">
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  {user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'TRAINER' ? 'Тренер' : 'Клиент'}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            transition: 'width 0.3s ease',
            '& .MuiDrawer-paper': {
              width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
              boxSizing: 'border-box',
              transition: 'width 0.3s ease',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'white',
            color: 'text.primary',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <Toolbar sx={{ minHeight: { md: 64 } }}>
            {!isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setCollapsed(!collapsed)}
                sx={{ mr: 1 }}
              >
                {collapsed ? <ChevronRight /> : <MenuIcon />}
              </IconButton>
            )}
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton color="inherit" onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={() => setNotifAnchorEl(null)}
              PaperProps={{ sx: { width: 320, maxHeight: 400, mt: 1 } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={600}>Уведомления</Typography>
                {unreadCount > 0 && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={handleMarkAllAsRead}
                  >
                    Прочитать все
                  </Typography>
                )}
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Notifications sx={{ color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Нет уведомлений</Typography>
                </Box>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <MenuItem
                    key={notif.id}
                    sx={{
                      py: 1.5,
                      backgroundColor: notif.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                    onMouseEnter={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotifIcon(notif.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600} noWrap>
                            {notif.title}
                          </Typography>
                          {!notif.isRead && <Circle sx={{ fontSize: 8, color: 'primary.main', ml: 1 }} />}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notif.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </MenuItem>
                ))
              )}
            </Menu>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit" sx={{ ml: 0.5 }}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                <Person sx={{ mr: 1 }} /> Профиль
              </MenuItem>
              <MenuItem onClick={() => { logout(); navigate('/login'); setAnchorEl(null); }}>
                <Logout sx={{ mr: 1 }} /> Выйти
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      {isMobile && (
        <Box
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            backgroundColor: 'white', borderTop: '1px solid #E2E8F0',
            display: 'flex', justifyContent: 'space-around', py: 1, zIndex: theme.zIndex.appBar,
          }}
        >
          {menuItems.slice(0, 5).map((item) => (
            <Box
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                px: 1,
              }}
            >
              {item.icon}
              <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.25 }}>
                {item.text.split(' ')[0]}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
