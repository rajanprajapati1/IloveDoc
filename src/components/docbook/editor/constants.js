"use client";

import { alpha, styled } from "@mui/material/styles";
import { Switch } from "@mui/material";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export const richTokenBoundarySelector =
  "[data-highlight], [data-img-ref], [data-user-mention], [data-folder-ref]";

export const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 34,
  height: 20,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(14px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#8b5e3c',
        opacity: 1,
        border: 0,
        ...theme.applyStyles?.('dark', {
          backgroundColor: '#c4956a',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#d97706',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles?.('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      ...theme.applyStyles?.('dark', {
        opacity: 0.3,
      }),
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 16,
    height: 16,
  },
  '& .MuiSwitch-track': {
    borderRadius: 20 / 2,
    backgroundColor: alpha('#8b5e3c', 0.2),
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
    ...theme.applyStyles?.('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));
