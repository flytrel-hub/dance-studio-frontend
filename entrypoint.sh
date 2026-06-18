#!/bin/sh
if [ -n "$VITE_API_URL" ]; then
  echo "window.__ENV__ = { VITE_API_URL: \"$VITE_API_URL\" };" > /app/dist/config.js
  echo "Config set: VITE_API_URL=$VITE_API_URL"
else
  echo "WARNING: VITE_API_URL not set"
fi
exec serve -s dist -l 5173
