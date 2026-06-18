import React from 'react';
import { Avatar } from '@mui/material';

interface InitialsAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  sx?: any;
}

const COLORS = ['#6B46C1', '#E53E3E', '#38A169', '#D69E2E', '#3182CE', '#805AD5', '#DD6B20', '#319795'];

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, avatarUrl, size = 40, sx }) => {
  return (
    <Avatar
      src={avatarUrl || undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: getColor(name),
        fontSize: size * 0.4,
        fontWeight: 600,
        ...sx,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};
