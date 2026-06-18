import React, { useState } from 'react';
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
  Home, Notifications, Event, Info, Star,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { InitialsAvatar } from '../InitialsAvatar';

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
  { text: 'Профиль', icon: <Person />, path: '/profile' },
];

const clientMenuItems = [
  { text: 'Главная', icon: <Home />, path: '/' },
  { text: 'Расписание', icon: <CalendarMonth />, path: '/schedule' },
  { text: 'Абонементы', icon: <CardMembership />, path: '/subscriptions' },
  { text: 'Посещения', icon: <CheckCircle />, path: '/attendance' },
  { text: 'Профиль', icon: <Person />, path: '/profile' },
];

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

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems :
    user?.role === 'TRAINER' ? trainerMenuItems : clientMenuItems;

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
              <Badge badgeContent={2} color="error">
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
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={600}>Уведомления</Typography>
              </Box>
              <MenuItem onClick={() => setNotifAnchorEl(null)} sx={{ py: 1.5 }}>
                <ListItemIcon><Event fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText primary="Изменение в расписании" secondary="Сегодня, 10:00" />
              </MenuItem>
              <MenuItem onClick={() => setNotifAnchorEl(null)} sx={{ py: 1.5 }}>
                <ListItemIcon><Info fontSize="small" color="info" /></ListItemIcon>
                <ListItemText primary="Напоминание о занятии" secondary="Сегодня, 09:00" />
              </MenuItem>
              <MenuItem onClick={() => setNotifAnchorEl(null)} sx={{ py: 1.5 }}>
                <ListItemIcon><Star fontSize="small" color="warning" /></ListItemIcon>
                <ListItemText primary="Акция: Приведи друга" secondary="Вчера, 18:20" />
              </MenuItem>
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
