CREATE TABLE `KanbanTaskActivities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `task_userid` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `body` VARCHAR(1000) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `KanbanTaskActivities_task_id_task_userid_idx`(`task_id`, `task_userid`),
    INDEX `KanbanTaskActivities_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `KanbanTaskActivities_task_id_task_userid_fkey`
        FOREIGN KEY (`task_id`, `task_userid`) REFERENCES `KanbanTasks`(`id`, `userid`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `KanbanTaskActivities_user_id_fkey`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
