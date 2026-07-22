ALTER TABLE `KanbanTasks`
    ADD COLUMN `deleted_at` DATETIME(0) NULL,
    ADD INDEX `KanbanTasks_deleted_at_idx`(`deleted_at`);
