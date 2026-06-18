# Dance Studio Frontend

React UI для управления танцевальной студией.

## Технологии

- React 19 + TypeScript
- Vite
- TanStack Query
- Material UI
- React Hook Form + Zod
- Recharts

## Быстрый запуск

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

## Переменные окружения

Создай `.env` файл:

```
VITE_API_URL=http://localhost:3000
```

Для продакшена (Railway) укажи URL backend сервиса.

## Деплой на Railway

1. Создай проект на [railway.app](https://railway.app)
2. Подключи репозиторий
3. Добавь переменную окружения:

| Переменная | Значение |
|---|---|
| `VITE_API_URL` | URL backend (напр. `https://backend.up.railway.app`) |

4. Railway автоматически соберёт и запустит приложение

## Роли

- **Администратор** — полный доступ
- **Тренер** — расписание, группы, посещаемость
- **Клиент** — расписание, абонементы, запись на занятия
