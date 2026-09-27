import type { AnnouncementFilters } from './api';
export type AppEvents = {
  announcementSearchCondition: AnnouncementFilters;
  getByHashtags: string[];
};
