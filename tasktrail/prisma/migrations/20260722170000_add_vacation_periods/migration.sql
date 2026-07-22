CREATE TABLE `VacationPeriods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `start_date` DATETIME(0) NOT NULL,
    `end_date` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `VacationPeriods_user_id_idx`(`user_id`),
    INDEX `VacationPeriods_start_date_end_date_idx`(`start_date`, `end_date`),
    PRIMARY KEY (`id`),
    CONSTRAINT `VacationPeriods_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
