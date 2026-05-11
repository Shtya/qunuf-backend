import { Notification } from "src/common/entities/notification.entity";
import { User } from "src/common/entities/user.entity";
import { AppGateway } from "src/common/websocket/app.gateway";

import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    DataSource,
} from "typeorm";

@EventSubscriber()
export class NotificationSubscriber
    implements EntitySubscriberInterface<Notification> {
    constructor(
        dataSource: DataSource,
        private readonly chatGateway: AppGateway,
    ) {
        dataSource.subscribers.push(this);

    }

    // Tell TypeORM which entity we listen to
    listenTo(): Function {
        return Notification;
    }

    // This will be called by TypeORM when a Notification is inserted
    async afterInsert(event: InsertEvent<Notification>) {
        const notif = event.entity;
        if (!notif || !notif.userId) return;

        try {
            this.chatGateway.emitNewNotification(notif.userId, notif);
            await event.manager.increment(User, { id: event.entity.userId }, 'notificationUnreadCount', 1);
        } catch (err) {
            // log but don't crash DB operation
            console.error('NotificationSubscriber emit error', err);
        }
    }


    async afterUpdate(event: UpdateEvent<Notification>) {
        if (!event.databaseEntity || !event.entity) {
            return;
        }

        // If isRead changed from false to true
        if (event.databaseEntity.isRead === false && event?.entity?.isRead === true) {
            await event.manager.decrement(User, { id: event.databaseEntity.userId }, 'notificationUnreadCount', 1);
        }
    }

    async afterRemove(event: RemoveEvent<Notification>) {
        if (!event.databaseEntity || !event.entity) {
            return;
        }

        if (event.databaseEntity && !event.databaseEntity.isRead) {
            await event.manager.decrement(User, { id: event.databaseEntity.userId }, 'notificationUnreadCount', 1);
        }
    }

}
