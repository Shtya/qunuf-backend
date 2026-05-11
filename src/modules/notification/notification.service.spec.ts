import { NotificationService } from './notification.service';
import { Notification } from 'src/common/entities/notification.entity';

describe('NotificationService', () => {
  describe('deleteOldNotifications', () => {
    it('deletes notifications older than 3 months', async () => {
      const execute = jest.fn().mockResolvedValue({ affected: 7 });
      const where = jest.fn().mockReturnValue({ execute });
      const from = jest.fn().mockReturnValue({ where });
      const deleteMock = jest.fn().mockReturnValue({ from });
      const createQueryBuilder = jest.fn().mockReturnValue({ delete: deleteMock });

      const notificationService = new NotificationService(
        { createQueryBuilder } as any,
        {} as any,
      );

      const affected = await notificationService.deleteOldNotifications();

      expect(affected).toBe(7);
      expect(createQueryBuilder).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalled();
      expect(from).toHaveBeenCalledWith(Notification);
      expect(where).toHaveBeenCalledWith('created_at < :threshold', expect.objectContaining({ threshold: expect.any(Date) }));
      expect(execute).toHaveBeenCalled();
    });
  });
});
