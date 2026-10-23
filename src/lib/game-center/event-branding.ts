import { env } from '$env/dynamic/public';

export const EVENT_NAME = env.PUBLIC_EVENT_NAME?.trim() || 'Dev Fest';
